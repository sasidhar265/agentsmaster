import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const number=value=>typeof value==='number' && Number.isFinite(value) && value>=0?value:null;
export function normalizeUsage(raw) {
  const models=Object.entries(raw?.modelMetrics || {}).map(([model,metric])=>{
    const u=metric?.usage || {};
    const input=number(u.inputTokens),read=number(u.cacheReadTokens),write=number(u.cacheWriteTokens);
    const uncached=number(metric?.tokenDetails?.input?.tokenCount) ?? (input!==null && read!==null && write!==null && input>=read+write?input-read-write:null);
    return {model,inputTokens:input,uncachedInputTokens:uncached,outputTokens:number(u.outputTokens),cacheReadTokens:read,cacheWriteTokens:write,reasoningTokens:number(u.reasoningTokens),requests:number(metric?.requests?.count)};
  });
  const sum=key=>models.length && models.every(m=>m[key]!==null)?models.reduce((n,m)=>n+m[key],0):null;
  const inputTokens=sum('inputTokens'),outputTokens=sum('outputTokens');
  return {available:models.length>0,models,inputTokens,outputTokens,totalTokens:inputTokens!==null && outputTokens!==null?inputTokens+outputTokens:null,cacheReadTokens:sum('cacheReadTokens'),cacheWriteTokens:sum('cacheWriteTokens'),apiDurationSeconds:number(raw?.totalApiDurationMs)===null?null:raw.totalApiDurationMs/1000,premiumRequestUnits:number(raw?.totalPremiumRequestCost),nanoAiUnits:number(raw?.totalNanoAiu),source:'Copilot session usage.json; session totals include agent work and are not attributed to individual test cases.'};
}
export async function buildDashboard(run,runDirectory,artifacts,requestedReport) {
  const root=path.join(runDirectory,'workspace/output');
  const reports=await Promise.all(artifacts.filter(a=>/\.trx$/i.test(a.path)).map(async a=>({...a,modifiedAt:(await fs.stat(path.join(root,a.path))).mtime.toISOString()})));
  reports.sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt));
  const report=requestedReport?reports.find(r=>r.path===requestedReport):reports[0];
  if(requestedReport && !report)throw new Error('Execution report not found in this run.');
  let evidence;
  try {
    const args=[path.join(import.meta.dirname,'execution_report.py'),root,...(report?[path.join(root,report.path)]:[])];
    const {stdout}=await execute(process.env.QA_PYTHON_BIN || 'python3',args,{timeout:15000,maxBuffer:12*1024*1024});evidence=JSON.parse(stdout);
  } catch {evidence={tests:[],executionSeconds:null,reportedCounters:{},warnings:['Execution parser unavailable. Install Python 3 or set QA_PYTHON_BIN.']};}
  let usageRaw=null;
  try{const file=path.join(runDirectory,'usage.json');const real=await fs.realpath(file);const base=await fs.realpath(runDirectory);if(real===path.join(base,'usage.json') && !(await fs.lstat(file)).isSymbolicLink() && (await fs.stat(file)).size<5*1024*1024)usageRaw=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
  const counts={total:evidence.tests.length,passed:0,failed:0,not_run:0,running:0,unknown:0};
  for(const test of evidence.tests)counts[test.status]++;
  const durations=evidence.tests.map(t=>t.durationSeconds).filter(v=>v!==null);
  const end=run.finishedAt?Date.parse(run.finishedAt):run.status==='running'?Date.now():null;
  return {run:{id:run.id,status:run.status,createdAt:run.createdAt,finishedAt:run.finishedAt || null,label:run.jira || run.prompt || 'Automation run',error:run.error || null,executionMode:run.executionMode || 'agent',stage:run.stage || null},...evidence,counts,passRate:counts.passed+counts.failed?100*counts.passed/(counts.passed+counts.failed):null,completionRate:counts.total?100*(counts.passed+counts.failed)/counts.total:null,wallSeconds:end===null?null:Math.max(0,(end-Date.parse(run.createdAt))/1000),testSeconds:durations.length?durations.reduce((a,b)=>a+b,0):null,averageTestSeconds:durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null,reports,selectedReport:report?.path || null,evidenceSource:report?'TRX report':'Feature inventory — no recorded execution',usage:run.executionMode==='bdd'?{...normalizeUsage(null),available:true,applicable:false,inputTokens:0,outputTokens:0,totalTokens:0,cacheReadTokens:0,cacheWriteTokens:0,apiDurationSeconds:0,source:'Direct .NET execution; no AI agent or model calls.'}:normalizeUsage(usageRaw)};
}
