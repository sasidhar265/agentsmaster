import {estimateTokenCost} from './costs.js';
let dashboard=null,pollTimer,requestVersion=0,rates={};
try{rates=JSON.parse(localStorage.getItem('qa-token-rates') || '{}') || {};}catch{}
const labels={passed:'Passed',failed:'Failed',not_run:'Not run',running:'Running',unknown:'Unknown'};
const count=value=>value===null || value===undefined?'Unavailable':Number(value).toLocaleString();
const duration=value=>value===null || value===undefined?'Unavailable':value<60?`${value.toFixed(2)}s`:`${Math.floor(value/60)}m ${(value%60).toFixed(1)}s`;
const money=value=>value===null?'Set model rates':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:4,maximumFractionDigits:6}).format(value);
function message(text){$('#dashboard-error').hidden=!text;$('#dashboard-error').textContent=text;}
function metric(label,value,note,kind=''){
 const card=el('div',null,`card metric-card ${kind}`);card.append(el('span',label),el('strong',value),el('small',note));return card;
}
const projectStatus={running:'In progress',finished:'Complete',failed:'Failed',blocked:'Blocked',cancelled:'Cancelled',interrupted:'Interrupted',timed_out:'Timed out'};
const projectPatterns={'1':'Requirements analysis','2':'Manual journey coverage','3':'Automation coverage','4':'End-to-end coverage','10':'Test execution','11':'Test data','12':'BRD outcome review'};
function runName(run){return run.jira || run.prompt?.trim() || run.files?.[0] || 'Untitled quality work';}
function renderProjectOverview(runs){
 const finished=runs.filter(r=>r.status==='finished').length,running=runs.filter(r=>r.status==='running').length;
 const risks=runs.filter(r=>['failed','blocked','interrupted','timed_out'].includes(r.status));
 const completion=runs.length?Math.round(finished/runs.length*100):0;
 const health=risks.length?'Needs attention':running?'Delivery in progress':runs.length?'On track':'Awaiting evidence';
 $('#project-health').textContent=health;$('.project-health').dataset.state=risks.length?'risk':running?'active':runs.length?'good':'empty';
 $('#project-summary').replaceChildren(
  metric('Quality work items',count(runs.length),'All recorded project runs'),
  metric('Delivery progress',`${completion}%`,`${finished} of ${runs.length} work items complete`,completion===100&&runs.length?'passed':''),
  metric('Active work',count(running),'Runs currently in progress'),
  metric('Needs attention',count(risks.length),'Failed, blocked, interrupted, or timed out',risks.length?'failed':'passed'));
 const workstreams=[['Requirements & analysis',['1']],['BRD outcome review',['12']],['Manual journey coverage',['2']],['Automation coverage',['3','4']],['Execution evidence',['10']],['Finance test data',['11']]];
 $('#project-workstreams').replaceChildren();
 for(const [name,patterns] of workstreams){
  const items=runs.filter(r=>patterns.includes(r.pattern)),done=items.filter(r=>r.status==='finished').length,percent=items.length?Math.round(done/items.length*100):0;
  const row=el('div',null,'project-workstream'),head=el('div');head.append(el('strong',name),el('span',items.length?`${done}/${items.length} complete`:'No work recorded'));
  const bar=el('progress');bar.max=100;bar.value=percent;bar.setAttribute('aria-label',`${name}: ${percent}% complete`);row.append(head,bar);$('#project-workstreams').append(row);
 }
 const milestones=[['Requirements understood',runs.some(r=>r.pattern==='1'&&r.status==='finished'),'Analysis evidence recorded'],['Journey tests designed',runs.some(r=>['2','4'].includes(r.pattern)&&r.status==='finished'),'Manual customer and dealer journeys'],['Automation prepared',runs.some(r=>['3','4'].includes(r.pattern)&&r.status==='finished'),'BDD scenarios and framework'],['Execution evidenced',runs.some(r=>r.pattern==='10'&&r.status==='finished'),'Recorded test execution results'],['Test data prepared',runs.some(r=>r.pattern==='11'&&r.status==='finished'),'Source-grounded finance datasets']];
 $('#project-milestones').replaceChildren();for(const [name,done,note] of milestones){const row=el('div',null,`project-milestone ${done?'complete':'pending'}`);row.append(el('span',done?'✓':'○','milestone-mark'));const text=el('div');text.append(el('strong',name),el('small',note));row.append(text);$('#project-milestones').append(row);}
 $('#project-risk-count').textContent=`${risks.length} OPEN`;$('#project-risks').replaceChildren();
 if(!risks.length)$('#project-risks').append(el('p','No recorded delivery risks. Completed execution evidence is still required before release decisions.','project-empty'));
 for(const run of risks.slice(0,5)){const row=el('div',null,'project-list-item'),text=el('div');text.append(el('strong',runName(run)),el('small',`${projectStatus[run.status] || run.status} · ${new Date(run.createdAt).toLocaleString()}`));row.append(el('span','!','project-list-icon risk'),text);$('#project-risks').append(row);}
 $('#project-activity').replaceChildren();
 if(!runs.length)$('#project-activity').append(el('p','Project activity will appear after the first quality run.','project-empty'));
  for(const run of runs.slice(0,5)){const row=el('div',null,'project-list-item'),text=el('div');text.append(el('strong',runName(run)),el('small',`${projectPatterns[run.pattern] || 'Quality work'} · ${projectStatus[run.status] || run.status}`));row.append(el('span',run.status==='finished'?'✓':'·',`project-list-icon ${run.status}`),text,el('time',new Date(run.createdAt).toLocaleDateString()));$('#project-activity').append(row);}
}
function usageCost(){return dashboard?.usage.applicable===false?0:dashboard?estimateTokenCost(dashboard.usage.models,rates):null;}
function agentCost(agent){return dashboard?.usage.applicable===false?0:agent?estimateTokenCost(agent.models || [],rates):null;}
function renderCost(){const element=$('#token-cost-value');if(element)element.textContent=dashboard.usage.available?money(usageCost()):'Unavailable';}
function renderRates(){
 $('#model-pricing').replaceChildren();
 for(const model of dashboard.usage.models){
  const section=el('fieldset',null,'model-rates');section.append(el('legend',model.model));
  for(const [key,label] of [['input','Uncached input'],['output','Output'],['read','Cache read'],['write','Cache write']]){
   const wrapper=el('label',label);const input=el('input');input.type='number';input.min='0';input.step='any';input.placeholder='USD / 1M';input.value=rates[model.model]?.[key] ?? '';
   input.oninput=()=>{rates={...rates,[model.model]:{...rates[model.model],[key]:input.value}};try{localStorage.setItem('qa-token-rates',JSON.stringify(rates));}catch{}renderCost();};wrapper.append(input);section.append(wrapper);
  }$('#model-pricing').append(section);
 }
}
function renderTests(){
 if(!dashboard)return;
 const query=$('#test-search').value.trim().toLowerCase(),status=$('#test-status-filter').value;
 const tests=dashboard.tests.filter(t=>(status==='all' || t.status===status) && `${t.name} ${t.suite} ${t.failure} ${t.details}`.toLowerCase().includes(query));
 $('#dashboard-tests').replaceChildren();$('#test-count-label').textContent=`${tests.length} of ${dashboard.tests.length} test cases shown`;
 for(const test of tests){
  const row=el('tr'),name=el('td');name.append(el('strong',test.name),el('small',test.suite || test.id));if(test.attempts>1)name.append(el('small',`${test.attempts} recorded attempts · final outcome shown`));
  const state=el('td');state.append(el('span',labels[test.status],`test-status ${test.status}`));state.append(el('small',test.outcome));
  const detail=el('td');
  if(test.status==='failed'){
   const failure=test.failure || 'The runner did not include a failure message.';
   detail.append(el('p',failure.split('\n').find(line=>line.trim())?.slice(0,300) || failure));
   const expanded=el('details'),summary=el('summary','Failure details & stack trace');expanded.append(summary,el('pre',`${failure}${test.stackTrace?'\n\n'+test.stackTrace:''}`));detail.append(expanded);
  }else detail.append(el('p',test.details || (test.status==='passed'?'No failure recorded.':'No failure details recorded.')));
  row.append(name,state,el('td',duration(test.durationSeconds)),detail);$('#dashboard-tests').append(row);
 }
 if(!tests.length){const row=el('tr'),cell=el('td',dashboard.tests.length?'No tests match these filters.':'No test results or discoverable scenarios are available yet.');cell.colSpan=4;row.append(cell);$('#dashboard-tests').append(row);}
}
function renderDashboard(){
 const d=dashboard,c=d.counts,u=d.usage;
 $('#dashboard-empty').hidden=true;$('#dashboard-content').hidden=false;$('#dashboard-export').disabled=false;
 $('#dashboard-state').textContent=`Run ${d.run.status}${d.run.status==='running' && d.run.stage?' · '+d.run.stage:''}`;$('#dashboard-evidence').textContent=d.evidenceSource;$('#dashboard-updated').textContent=`Updated ${new Date().toLocaleTimeString()}`;
 $('#dashboard-warnings').replaceChildren();for(const warning of [...d.warnings,...(d.run.error?[d.run.error]:[])])$('#dashboard-warnings').append(el('p',warning,'workflow-callout'));
 $('#dashboard-metrics').replaceChildren(
  metric('Passed',count(c.passed),'Recorded successful tests','passed'),metric('Failed',count(c.failed),'Including errors and timeouts','failed'),metric('Not run',count(c.not_run),'Skipped or no recorded execution','not-run'),metric('Pass rate',d.passRate===null?'—':`${d.passRate.toFixed(1)}%`,'Passed / passed + failed'),
  metric('Execution time',duration(d.executionSeconds),'Selected TRX start → finish'),metric('Total elapsed',duration(d.wallSeconds),d.run.executionMode==='bdd'?'Backend execution job':'Entire QA agent run'),metric('Tokens used',count(u.totalTokens),u.applicable===false?'Direct .NET · no model calls':'Input + output · entire session'),metric('Estimated token cost',u.available?money(usageCost()):'Unavailable','USD · based on your model rates'));
 $('#dashboard-metrics').lastChild.querySelector('strong').id='token-cost-value';
 const agentUsage=new Map((u.agents || []).map(agent=>[agent.name,agent]));
 const agents=(d.agents || []).map(progress=>({progress,usage:agentUsage.get(progress.name)}));
 for(const agent of u.agents || [])if(!agents.some(item=>item.progress.name===agent.name))agents.push({progress:{name:agent.name,description:'Reported by runner usage telemetry',status:'unconfirmed'},usage:agent});
 const totals={completed:agents.filter(a=>a.progress.status==='completed').length,blocked:agents.filter(a=>a.progress.status==='blocked').length,running:agents.filter(a=>a.progress.status==='running').length,unknown:agents.filter(a=>['unconfirmed','stopped','pending'].includes(a.progress.status)).length,usage:agents.filter(a=>a.usage?.totalTokens!==null && a.usage?.totalTokens!==undefined).length};
 $('#agent-summary-status').textContent=d.run.executionMode==='bdd'?'NO AI AGENTS':'AGENT STAGES';
 $('#agent-summary').replaceChildren(
  metric('Agents reported complete',`${totals.completed} / ${agents.length}`,`${totals.blocked} blocked · ${totals.running} active`),
  metric('Agent usage attributed',`${totals.usage} / ${agents.length}`,'Per-agent runner telemetry available'),
  metric('Session tokens',count(u.totalTokens),'Whole-run input + output'),
  metric('Session cost',u.available?money(usageCost()):'Unavailable','USD · configured rates'),
  metric('Run elapsed',duration(d.wallSeconds),'Start to finish, including orchestration'));
 const verdicts=agents.map(a=>a.progress.qualityVerdict).filter(Boolean),passed=verdicts.filter(v=>v==='PASS').length,failed=verdicts.filter(v=>v==='FAIL'||v==='BUILD FAILED').length;
 $('#agent-summary-note').textContent=agents.length?`${totals.completed} agent stage(s) reported complete, ${totals.blocked} blocked, and ${totals.unknown} have no confirmed completion. Recorded quality reports: ${passed} pass, ${failed} fail, ${verdicts.filter(v=>v==='BLOCKED'||v==='NEEDS-IMPROVEMENT').length} blocked or needs improvement. Stage completion is not a quality pass. Per-agent token attribution is shown only when runner telemetry supplies it.`:'This run did not invoke QA agents. The whole-run elapsed time and test execution results are shown below.';
 $('#agent-count').textContent=`${agents.length} AGENTS`;
 $('#agent-usage').replaceChildren();
 for(const {progress,usage:agent} of agents){
  const row=el('tr'),name=el('td');name.append(el('strong',progress.name),el('small',progress.description));
  const state=el('td');state.append(el('span',progress.status.replaceAll('_',' '),`test-status ${progress.status==='completed'?'passed':progress.status==='blocked'?'failed':progress.status==='running'?'running':'unknown'}`));
  if(progress.qualityVerdict)state.append(el('small',`Gate: ${progress.qualityVerdict}`,`agent-verdict ${progress.qualityVerdict.toLowerCase().replaceAll('-','_')}`));
  if(progress.artifactCount>0)state.append(el('small',`${progress.artifactCount} artifact(s)`));
  row.append(name,state,el('td',duration(progress.durationSeconds)),el('td',count(agent?.inputTokens)),el('td',count(agent?.outputTokens)),el('td',count(agent?.totalTokens)),el('td',agent?.models?.length?money(agentCost(agent)):'Unavailable'));
  $('#agent-usage').append(row);
 }
 if(!agents.length){const row=el('tr'),cell=el('td','No agent stages were used for this run.');cell.colSpan=7;row.append(cell);$('#agent-usage').append(row);}
 $('#dashboard-total').textContent=`${c.total} TEST CASES`;
 $('#outcome-bars').replaceChildren();for(const status of ['passed','failed','not_run','running','unknown']){
  if(!c[status] && ['running','unknown'].includes(status))continue;
  const row=el('div',null,`outcome-bar ${status}`);const progress=el('progress');progress.max=Math.max(1,c.total);progress.value=c[status];progress.setAttribute('aria-label',`${labels[status]}: ${c[status]} of ${c.total}`);row.append(el('span',labels[status]),progress,el('strong',String(c[status])));$('#outcome-bars').append(row);
 }
 $('#execution-timing').replaceChildren();for(const [label,value] of [['Tests completed',d.completionRate===null?'—':`${d.completionRate.toFixed(1)}%`],['Summed test time',duration(d.testSeconds)],['Average test time',duration(d.averageTestSeconds)],['Agent API time',duration(u.apiDurationSeconds)]]){const item=el('div');item.append(el('small',label),el('strong',value));$('#execution-timing').append(item);}
 $('#usage-summary').replaceChildren();for(const [label,value] of [['Input tokens',u.inputTokens],['Output tokens',u.outputTokens],['Cache read',u.cacheReadTokens],['Cache write',u.cacheWriteTokens]]){const item=el('div');item.append(el('small',label),el('strong',count(value)));$('#usage-summary').append(item);}
 $('#model-usage').replaceChildren();for(const model of u.models){const row=el('div',null,'model-usage-row');row.append(el('strong',model.model),el('span',`${count(model.inputTokens)} in / ${count(model.outputTokens)} out`));$('#model-usage').append(row);}
 $('.pricing-settings').hidden=u.applicable===false;$('#usage-note').textContent=u.applicable===false?'Direct .NET test execution. No AI model was invoked, so token usage and token cost are zero.':u.available?'Measured session totals and per-agent metrics are shown when the runner provides agentMetrics. Durations are shown only when supplied by the runner; API duration is not wall-clock work time.':'Usage is unavailable for this run. New runs capture usage.json when Copilot exits; older or interrupted runs may have no token statistics. Session totals may not include per-agent attribution.';
 // Preserve partially edited rate fields while an active run refreshes.
 const modelKey=u.models.map(m=>m.model).join('|');if($('#model-pricing').dataset.models!==modelKey){$('#model-pricing').dataset.models=modelKey;renderRates();}
 renderTests();
}
async function loadSelectedReport(){
 const version=++requestVersion;clearTimeout(pollTimer);const id=$('#dashboard-run').value;
 if(!id){dashboard=null;$('#dashboard-empty').hidden=false;$('#dashboard-content').hidden=true;$('#dashboard-export').disabled=true;return;}
 message('');try{
  const selected=$('#dashboard-report').value;const data=await api(`/api/runs/${id}/dashboard${selected?'?report='+encodeURIComponent(selected):''}`);
  if(version!==requestVersion || page!=='dashboard')return;
  dashboard=data;const selector=$('#dashboard-report');selector.replaceChildren();const latest=el('option','Latest available report');latest.value='';selector.append(latest);
  for(const report of data.reports){const option=el('option',`${report.name} · ${new Date(report.modifiedAt).toLocaleString()}`);option.value=report.path;selector.append(option);}if(data.reports.some(r=>r.path===selected))selector.value=selected;
  renderDashboard();if(data.run.status==='running')pollTimer=setTimeout(loadSelectedReport,4000);
 }catch(e){if(version===requestVersion){message(e.message);$('#dashboard-content').hidden=true;$('#dashboard-export').disabled=true;}}
}
async function refreshDashboard(){
 clearTimeout(pollTimer);message('');try{
  const allRuns=await api('/api/runs');if(page!=='dashboard')return;renderProjectOverview(allRuns);
  const runs=allRuns.filter(r=>['1','2','3','4','10','11','12'].includes(r.pattern));
  const select=$('#dashboard-run'),previous=select.value;select.replaceChildren();
  if(!runs.length){const option=el('option','No automation runs yet');option.value='';select.append(option);}
  for(const run of runs){const option=el('option',`${run.jira || run.prompt.slice(0,65) || 'Automation run'} · ${new Date(run.createdAt).toLocaleString()} · ${run.status}`);option.value=run.id;select.append(option);}if(runs.some(r=>r.id===previous))select.value=previous;
  await loadSelectedReport();
 }catch(e){message(e.message);}
}
$('#dashboard-run').onchange=()=>{$('#dashboard-report').value='';loadSelectedReport();};$('#dashboard-report').onchange=loadSelectedReport;$('#dashboard-refresh').onclick=refreshDashboard;$('#test-search').oninput=renderTests;$('#test-status-filter').onchange=renderTests;
$('#dashboard-export').onclick=()=>{if(!dashboard)return;const content={...dashboard,costEstimate:{currency:'USD',amount:usageCost(),ratesPerMillionTokens:rates,basis:'User-configured rates, not billed charges'}};const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download=`execution-${dashboard.run.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('qa-page-change',event=>{clearTimeout(pollTimer);requestVersion++;if(event.detail==='dashboard')refreshDashboard();});
if(page==='dashboard')refreshDashboard();
