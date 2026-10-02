import {promises as fs} from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {buildDashboard} from './dashboard.mjs';

export function validateBddOptions(data) {
  const configuration=data.configuration ?? 'Release';
  if(!['Release','Debug'].includes(configuration))throw new Error('Select Release or Debug configuration.');
  const filter=data.testFilter ?? '';
  if(typeof filter!=='string' || filter.length>1000 || /[\x00-\x1f\x7f]/.test(filter))throw new Error('Test filter must be a single line of at most 1,000 characters.');
  return {configuration,testFilter:filter.trim()};
}
const escape=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blocked=message=>Object.assign(new Error(message),{blocked:true});
export function startBddExecution({run,directory,save,onDone}) {
  const framework=path.join(directory,'workspace/output/bddautomator/AutomationFramework');
  const results=path.join(framework,'TestResults');
  const executable=process.env.QA_DOTNET_BIN || 'dotnet';
  let child,log='',stopped=false,killTimer;
  const control={qaRun:run,kill(){stopped=true;if(child?.pid){const pid=child.pid;const kill=signal=>{try{if(process.platform==='win32')child.kill(signal);else process.kill(-pid,signal);}catch{}};kill('SIGTERM');killTimer=setTimeout(()=>kill('SIGKILL'),3000);killTimer.unref();}}};
  const check=()=>{if(stopped || ['cancelled','timed_out'].includes(run.status))throw new Error('Execution stopped.');};
  const append=value=>{log=(log+value).slice(-200000);};
  const flush=()=>fs.writeFile(path.join(directory,'activity.log'),log);
  async function command(stage,args){
    check();run.stage=stage;await save(run);append(`\n[${stage}] dotnet ${args.map(a=>JSON.stringify(a)).join(' ')}\n`);
    return new Promise((resolve,reject)=>{
      let output='';
      child=spawn(executable,args,{cwd:framework,detached:process.platform!=='win32',env:{...process.env,DOTNET_NOLOGO:'1',DOTNET_CLI_TELEMETRY_OPTOUT:'1'},stdio:['ignore','pipe','pipe']});
      const stream=chunk=>{const value=chunk.toString();output=(output+value).slice(-100000);append(value);};
      child.stdout.on('data',stream);child.stderr.on('data',stream);
      child.once('error',error=>{child=null;reject(error.code==='ENOENT'?blocked('The .NET SDK executable was not found. Install .NET or set QA_DOTNET_BIN.'):error);});
      child.once('close',(code,signal)=>{child=null;resolve({code,signal,output});});
    });
  }
  async function preflight(){
    run.stage='preflight';await save(run);check();
    await fs.access(path.join(framework,'AutomationFramework.csproj'));
    for(const file of ['appsettings.json','Input/TestData.json']){
      let data;try{data=JSON.parse(await fs.readFile(path.join(framework,file),'utf8'));}catch{throw blocked(`Missing or invalid ${file}. Configure the selected framework before running.`);}
      const missing=[];
      function visit(value,key){if(typeof value==='string' && value.includes('REPLACE_WITH_'))missing.push(key);else if(value && typeof value==='object')for(const [k,v] of Object.entries(value))visit(v,key?`${key}.${k}`:k);}
      visit(data,'');if(missing.length)throw blocked(`Unresolved configuration in ${file}: ${missing.join(', ')}. Update these values in the source framework.`);
    }
    const sdk=await command('preflight',['--list-sdks']);check();
    if(sdk.code!==0 || !/^\d+\.\d+\.\d+/m.test(sdk.output))throw blocked('No usable .NET SDK was reported by dotnet --list-sdks.');
  }
  async function publish(verdict,detail){
    const reportDirectory=path.join(directory,'workspace/output/runforge');await fs.mkdir(reportDirectory,{recursive:true});
    const files=(await fs.readdir(results).catch(()=>[])).filter(name=>name.endsWith('.trx')).map(name=>({name,path:`bddautomator/AutomationFramework/TestResults/${name}`}));
    const dashboard=await buildDashboard(run,directory,files);
    const summary=`# BDD execution summary\n\n**Verdict:** ${verdict}\n\n${detail}\n\nConfiguration: ${run.configuration}\n\nFilter: ${run.testFilter || 'All tests'}\n\nTotal: ${dashboard.counts.total} · Passed: ${dashboard.counts.passed} · Failed: ${dashboard.counts.failed} · Not run: ${dashboard.counts.not_run}\n\nResults are based on recorded TRX evidence. This direct .NET run does not invoke an AI agent.\n`;
    await fs.writeFile(path.join(reportDirectory,'BDD-ExecutionSummary.md'),summary);
    const rows=dashboard.tests.map(t=>`<tr><td>${escape(t.name)}</td><td>${escape(t.status)}</td><td>${escape(t.durationSeconds ?? 'Unavailable')}</td><td><pre>${escape(t.failure || t.details)}${t.stackTrace?'\n'+escape(t.stackTrace):''}</pre></td></tr>`).join('');
    await fs.writeFile(path.join(reportDirectory,'BDD-ExecutionReport.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BDD execution report</title><body><h1>BDD execution: ${escape(verdict)}</h1><p>${escape(detail)}</p><p>Passed: ${dashboard.counts.passed} · Failed: ${dashboard.counts.failed} · Not run: ${dashboard.counts.not_run}</p><table border="1" cellpadding="10"><thead><tr><th>Test</th><th>Status</th><th>Duration (s)</th><th>Failure / details</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    return dashboard;
  }
  const timeout=setTimeout(()=>{run.status='timed_out';control.kill();},30*60*1000);
  const interval=setInterval(()=>flush().catch(()=>{}),500);
  const done=(async()=>{
    let verdict='BLOCKED',detail='';
    try{
      await fs.mkdir(results,{recursive:true});await preflight();
      for(const [stage,args] of [['restoring',['restore','AutomationFramework.csproj']],['building',['build','AutomationFramework.csproj','--no-restore','-c',run.configuration]]]){
        const result=await command(stage,args);check();if(result.code!==0)throw new Error(`${stage==='building'?'Build':'Restore'} failed (exit ${result.code ?? result.signal}). See Run activity for diagnostics.`);
      }
      const args=['test','AutomationFramework.csproj','--no-build','--no-restore','-c',run.configuration,'--logger','trx;LogFilePrefix=bdd','--results-directory',results];
      if(run.testFilter)args.push('--filter',run.testFilter);
      const execution=await command('testing',args);check();run.testExitCode=execution.code;run.stage='publishing';await save(run);
      const files=(await fs.readdir(results)).filter(name=>name.endsWith('.trx')).map(name=>({name,path:`bddautomator/AutomationFramework/TestResults/${name}`}));
      const evidence=await buildDashboard(run,directory,files);
      check();
      if(evidence.warnings.length)throw blocked(`Execution evidence could not be verified: ${evidence.warnings.join(' ')}`);
      if(!files.length || !evidence.counts.total || !(evidence.counts.passed+evidence.counts.failed))throw blocked('No executed tests were recorded. Check the test filter, test adapter, and TRX output.');
      if(execution.code!==0 || evidence.counts.failed || evidence.counts.unknown || evidence.counts.running){run.status='failed';verdict='FAIL';detail=`Test execution returned exit ${execution.code ?? execution.signal}; ${evidence.counts.failed} failed tests. Review individual outcomes and failure details.`;run.error=detail;}
      else {run.status='finished';verdict='PASS';detail=`${evidence.counts.passed} tests passed; ${evidence.counts.not_run} not run.`;}
    }catch(error){
      if(!['cancelled','timed_out'].includes(run.status))run.status=error.blocked?'blocked':'failed';
      verdict=run.status.toUpperCase();detail=error.message;run.error=detail;append(`\n${verdict}: ${detail}\n`);
    }finally{
      clearTimeout(timeout);clearInterval(interval);
      run.finishedAt=new Date().toISOString();run.stage='complete';run.verdict=verdict;
      try{await publish(verdict,detail);}catch(error){append(`\nReport export failed: ${error.message}\n`);if(run.status==='finished'){run.status='failed';run.error='Report export failed. See activity.';}}
      try{await flush();await fs.writeFile(path.join(results,'bdd-execution.log'),log);await save(run);}finally{onDone();}
    }
    return run;
  })();
  // Keep asynchronous failures observed even if the HTTP caller has disconnected.
  done.catch(error=>{run.status='failed';run.error=error.message;onDone();});
  control.done=done;return control;
}
