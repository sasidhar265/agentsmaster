(() => {
  const key = 'qa-theme';
  const system = window.matchMedia?.('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  const valid = value => value === 'dark' || value === 'light';
  function apply(value) {
    const theme = valid(value) ? value : system?.matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    const picker = document.getElementById('theme-toggle');
    if (picker) {
      picker.setAttribute('aria-checked', String(theme === 'dark'));
      picker.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }
  }
  apply(preference);
  function bindPicker() {
    const picker = document.getElementById('theme-toggle');
    if (!picker) return;
    apply(preference);
    picker.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(preference);
      try { localStorage.setItem(key, preference); } catch {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindPicker, {once: true});
  else bindPicker();
  system?.addEventListener('change', () => { if (!valid(preference)) apply(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = event.newValue;
      apply(preference);
    }
  });
})();

// QA workspace application
const $=s=>document.querySelector(s);let selectedPattern='4',files=[],current=null,tab='manual',timer;
const manualCaseCache=new Map();
const descriptions={JiraExtractor:'Fetch finance requirements & attachments',SpecForge:'Analyze journeys, product rules & decisions',DomainOutcomeValidator:'Review domain fit, outcomes & acceptance evidence',TestCraft:'Generate finance journey test cases',GherkinGenie:'Generate finance BDD scenarios',QualitySentinel:'Review journey and control coverage',FeatureLens:'Validate finance automation readiness',SheetCraft:'Export validated finance tests to Excel',BDDAutomator:'Build the Reqnroll API framework',CodeSentinel:'Validate bindings, calculations & build',RunForge:'Execute journeys & publish evidence'};
const routes={'1':['SpecForge'],'2':['SpecForge','TestCraft','QualitySentinel','SheetCraft'],'3':['SpecForge','GherkinGenie','FeatureLens','BDDAutomator','CodeSentinel','RunForge'],'4':['SpecForge','TestCraft + GherkinGenie','QualitySentinel + FeatureLens','SheetCraft + BDDAutomator','CodeSentinel','RunForge'],'12':['DomainOutcomeValidator']};
const copilotModels={Anthropic:[['claude-sonnet-4.6','Claude Sonnet 4.6'],['claude-haiku-4.5','Claude Haiku 4.5']],OpenAI:[['gpt-5.4','GPT-5.4'],['gpt-6-astra','GPT-6 Astra'],['gpt-5.3-codex','GPT-5.3-Codex']],Google:[['gemini-3.5-flash','Gemini 3.5 Flash'],['gemini-3.6-flash','Gemini 3.6 Flash'],['gemini-3.7-flash','Gemini 3.7 Flash']]};
function addModelPicker(formId){
  const form=document.getElementById(formId),suffix=formId.replace('-form','');
  const box=el('div',null,'model-picker'),runner=el('select'),vendor=el('select'),model=el('select');
  runner.id=`${suffix}-runner`;vendor.id=`${suffix}-vendor`;model.id=`${suffix}-model`;
  for(const [value,label] of [['codex','Codex CLI'],['copilot','GitHub Copilot Enterprise']]){const option=el('option',label);option.value=value;runner.append(option);}
  for(const name of Object.keys(copilotModels)){const option=el('option',name);option.value=name;vendor.append(option);}
  function models(){model.replaceChildren();const automatic=el('option','Auto · Copilot chooses');automatic.value='auto';model.append(automatic);for(const [value,label] of copilotModels[vendor.value]){const option=el('option',label);option.value=value;model.append(option);}}
  function visibility(){const disabled=runner.value!=='copilot';vendor.disabled=disabled;model.disabled=disabled;box.classList.toggle('uses-copilot',!disabled);}models();runner.onchange=visibility;vendor.onchange=models;
  function field(labelText,control){const field=el('div',null,'model-field'),label=el('label',labelText);label.htmlFor=control.id;field.append(label,control);return field;}
  box.append(field('AI runner',runner),field('LLM Provider',vendor),field('Model',model));visibility();
  form.insertBefore(box,form.querySelector('.submit-row, .workflow-submit, #error, .workflow-error'));
  return()=>({provider:runner.value,model:runner.value==='copilot'?model.value:null});
}
const generationModel=addModelPicker('run-form'),executionModel=addModelPicker('execution-form'),dataModel=addModelPicker('data-form');
function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function error(message){$('#error').hidden=!message;$('#error').textContent=message;}
async function api(url,options){const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw new Error(data.error || 'Request failed');return data;}
function route(){const pattern=$('#analysis').checked?'1':selectedPattern;$('#route').replaceChildren();const agents=[...($('#jira').value.trim()?['JiraExtractor']:[]),...routes[pattern]];agents.forEach((name,i)=>{const row=el('div',null,'route-step');row.append(el('span',String(i+1).padStart(2,'0'),'step-number'));const content=el('div');content.append(el('strong',name),el('small',descriptions[name] || (name.includes('Quality')?'Independent quality gates':'Manual & automation tracks')));row.append(content);$('#route').append(row);});}
function choose(pattern){selectedPattern=pattern;$('#analysis').checked=false;document.querySelectorAll('[data-workflow]').forEach(b=>b.classList.toggle('selected',b.dataset.workflow===pattern));route();}
const financeJourneyPrompts={
 quote:'Test the end-to-end auto finance quote and eligibility journey. Cover vehicle and product eligibility, cash price, deposit boundaries, term, annual mileage, APR, monthly payment and final payment calculations, invalid combinations, disclosures, and downstream quote status. Identify any missing calculation or rounding rules.',
 credit:'Test the auto finance credit and affordability journey. Cover applicant identity and address history, income and expenditure, consent, bureau outcomes, affordability rules, accept, decline and referral decisions, duplicate applications, vulnerability indicators, reason codes, and audit evidence.',
 agreement:'Test auto finance agreement creation and activation. Cover pre-contract disclosures, quotation consistency, customer and vehicle details, consent, e-signature, document generation, cooling-off rules where supplied, dealer payout, activation failures, retries, and downstream agreement status.',
 servicing:'Test payment collection and agreement servicing. Cover payment schedules, direct debit setup and changes, successful and failed collections, partial payments, overpayments, statements, customer detail changes, fees, notifications, reconciliation, and servicing audit history.',
 settlement:'Test settlement and termination journeys. Cover settlement quote calculations and validity, payment allocation, early settlement, voluntary termination rules where supplied, vehicle return states, fees, refunds, agreement closure, customer communications, and downstream accounting updates.',
 arrears:'Test arrears, forbearance, and vulnerable customer support. Cover missed payments, arrears stages, contact preferences, affordability reassessment, payment arrangements, breathing space or other supplied protections, fees, communications, escalation, recovery states, and complete audit evidence.'
};
document.querySelectorAll('[data-finance-journey]').forEach(button=>button.onclick=()=>{const prompt=financeJourneyPrompts[button.dataset.financeJourney];$('#prompt').value=prompt;choose('4');document.querySelectorAll('[data-finance-journey]').forEach(item=>item.classList.toggle('selected',item===button));setPage('generation');$('#run-form').scrollIntoView({behavior:'smooth',block:'start'});$('#prompt').focus({preventScroll:true});});
document.querySelectorAll('[data-home-page]').forEach(button=>button.onclick=()=>setPage(button.dataset.homePage));
document.querySelectorAll('[data-workflow]').forEach(b=>b.onclick=()=>choose(b.dataset.workflow));$('#analysis').onchange=route;$('#jira').oninput=route;
function toggleInputMenu(open){$('#input-menu').hidden=!open;$('#add-input').setAttribute('aria-expanded',String(open));}
$('#add-input').onclick=()=>toggleInputMenu($('#input-menu').hidden);
$('#add-jira').onclick=()=>{toggleInputMenu(false);$('#jira-input').hidden=false;$('#jira').focus();};
$('#add-documents').onclick=()=>{toggleInputMenu(false);$('#files').click();};
$('#remove-jira').onclick=()=>{$('#jira').value='';$('#project').value='';$('#jira-input').hidden=true;route();$('#add-input').focus();};
document.addEventListener('click',e=>{if(!e.target.closest('.add-input-control'))toggleInputMenu(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && !$('#input-menu').hidden){toggleInputMenu(false);$('#add-input').focus();}});
document.addEventListener('focusin',e=>{if(!e.target.closest('.add-input-control'))toggleInputMenu(false);});
function addFiles(incoming){error('');for(const f of incoming){if(files.length>=10){error('You can attach up to 10 files.');break;}if(f.size>10*1024*1024 || !/\.(pdf|docx|xlsx|txt|md|json|csv|feature)$/i.test(f.name)){error(`${f.name}: use a supported format up to 10 MB.`);continue;}if(!files.some(a=>a.name===f.name && a.size===f.size))files.push(f);}renderFiles();}
function renderFiles(){$('#file-list').replaceChildren();files.forEach((f,i)=>{const row=el('div',null,'file-chip');row.append(el('span',`${f.name} · ${Math.max(1,Math.round(f.size/1024))} KB`));const remove=el('button','×');remove.type='button';remove.setAttribute('aria-label',`Remove ${f.name}`);remove.onclick=()=>{files.splice(i,1);renderFiles();};row.append(remove);$('#file-list').append(row);});}
$('#files').onchange=e=>{addFiles(e.target.files);e.target.value='';};for(const event of ['dragover','dragleave','drop'])$('#dropzone').addEventListener(event,e=>{e.preventDefault();$('#dropzone').classList.toggle('drag',event==='dragover');if(event==='drop')addFiles(e.dataTransfer.files);});
function encode(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name.replace(/[^\w .()-]/g,'_'),data:reader.result.split(',')[1]});reader.onerror=reject;reader.readAsDataURL(file);});}
const patternNames={'1':'Finance requirements analysis','2':'Finance test cases','3':'Finance automation','4':'End-to-end finance coverage','10':'Finance test execution','11':'Finance test data','12':'BRD domain and outcome review'};
let patternConfirmationPending=false;
function confirmPattern(payload){
  if(patternConfirmationPending)return Promise.resolve(false);
  const dialog=$('#pattern-confirmation');
  $('#pattern-title').textContent=`Pattern ${payload.pattern} · ${patternNames[payload.pattern]}`;
  $('#pattern-request').textContent=payload.prompt.trim() || 'Requirements supplied through the inputs below.';
  $('#pattern-inputs').textContent=[payload.jira && `Jira: ${payload.jira}`, ...(payload.files || []).map(file=>file.name), payload.sourceRun && `Framework: ${payload.sourceRun}`, payload.payloadId && `Payload: ${payload.payloadId}`, payload.baseName && `Dataset: ${payload.baseName}`].filter(Boolean).join(' · ') || 'Text requirements';
  const agents=routes[payload.pattern] || (payload.pattern==='10'?['CodeSentinel','RunForge']:['TestDataForge']);
  $('#pattern-agents').textContent=['QA-Master',...(payload.jira?.trim()?['JiraExtractor']:[]),...agents].join(' → ');
  dialog.returnValue='';
  patternConfirmationPending=true;
  return new Promise(resolve=>{
    dialog.onclose=()=>{patternConfirmationPending=false;resolve(dialog.returnValue==='ok');};
    dialog.showModal();
  });
}
$('#run-form').onsubmit=async e=>{e.preventDefault();error('');$('#submit').disabled=true;try{const payload={prompt:$('#prompt').value,jira:$('#jira').value,project:$('#project').value,pattern:$('#analysis').checked?'1':selectedPattern,files:await Promise.all(files.map(encode)),...generationModel()};if(!payload.prompt.trim() && !payload.jira.trim() && !payload.files.length)throw new Error('Add a prompt, a file, or a Jira reference.');if(!await confirmPattern(payload))return;const run=await api('/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});await selectRun(run.id);$('#results').scrollIntoView({behavior:'smooth',block:'start'});await loadRunHistory();}catch(e){error(e.message);}finally{$('#submit').disabled=current?.status==='running';}};
let activityRuns=[],activityPage=1,activityPageSize=10,activityRunId=null,activityRequest=0,activityTrigger=null;
function renderActivityTable(){
  const pages=Math.max(1,Math.ceil(activityRuns.length/activityPageSize));
  activityPage=Math.min(activityPage,pages);
  const start=(activityPage-1)*activityPageSize,body=$('#history');body.replaceChildren();
  for(const run of activityRuns.slice(start,start+activityPageSize)){
    const row=el('tr'),title=el('td'),name=run.jira || run.prompt || run.files?.[0] || 'Requirements run';
    const label=el('strong',name);label.title=name;title.append(label,el('small',run.id));
    const status=el('td');status.append(el('span',run.status,'status'));
    const action=el('td'),button=el('button','View logs');button.type='button';button.setAttribute('aria-label',`View logs for ${name}`);
    button.onclick=()=>{activityTrigger=button;openActivityDetail(run.id,true);};action.append(button);
    row.append(title,el('td',patternNames[run.pattern] || 'Test run'),el('td',new Date(run.createdAt).toLocaleString()),status,action);body.append(row);
  }
  if(!activityRuns.length){const row=el('tr'),cell=el('td','No activity yet. Generate test cases or run automation to see your history here.');cell.colSpan=5;cell.className='activity-empty';row.append(cell);body.append(row);}
  $('#activity-range').textContent=activityRuns.length?`${start+1}–${Math.min(start+activityPageSize,activityRuns.length)} of ${activityRuns.length} records`:'0 records';
  $('#activity-page-number').textContent=`Page ${activityPage} of ${pages}`;
  $('#activity-previous').disabled=activityPage<=1;$('#activity-next').disabled=activityPage>=pages;
}
async function loadRunHistory(){
  const runs=await api('/api/runs');activityRuns=[...runs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));renderActivityTable();return runs;
}
function activityLogActions(log){
  const actions=[];
  for(const line of (log || '').replace(/\u001b\[[0-9;]*m/g,'').split(/\r?\n/)){
    const progress=line.match(/^\s*QA_PROGRESS\s+(\S+)\s+(started|completed|blocked)\s*$/);
    const command=line.match(/^Executing:\s*(.*)/);
    const failure=/^\s*(Error:|Fatal:)/i.test(line);
    if(progress)actions.push({action:progress[1],status:progress[2],lines:[line]});
    else if(command)actions.push({action:'Command execution',status:'Recorded',lines:[line]});
    else if(failure)actions.push({action:'Runner error',status:'Error',lines:[line]});
    else if(/^Codex turn completed\./.test(line))actions.push({action:'Runner turn',status:'Completed',lines:[line]});
    else {
      if(!actions.length && line.trim())actions.push({action:'Runner output',status:'Recorded',lines:[]});
      if(actions.length)actions[actions.length-1].lines.push(line);
    }
  }
  return actions;
}
function renderActivityActions(log){
  const section=el('section',null,'activity-log-section');section.append(el('h3','Actions & detailed logs'));
  const actions=activityLogActions(log);
  if(!actions.length){section.append(el('p','No log entries have been recorded yet.'));return section;}
  const wrapper=el('div',null,'activity-table-scroll'),table=el('table',null,'activity-action-table');
  const caption=el('caption','Actions in recorded order. Expand a row to inspect its output.');table.append(caption);
  const head=el('thead'),headers=el('tr');
  for(const label of ['#','Action','Event','Details']){const th=el('th',label);th.setAttribute('scope','col');headers.append(th);}head.append(headers);table.append(head);
  const body=el('tbody');
  actions.forEach((action,index)=>{
    const row=el('tr'),status=el('td'),content=el('td'),details=el('details');
    status.append(el('span',action.status,'status'));
    const output=action.lines.join('\n').trim();
    details.append(el('summary',action.lines.find(line=>line.trim()) || 'View output'),el('pre',output,'activity-log'));
    details.open=actions.length===1 || action.status==='Error' || action.status==='blocked';
    content.append(details);row.append(el('td',String(index+1)),el('td',action.action),status,content);body.append(row);
  });
  table.append(body);wrapper.append(table);section.append(wrapper);return section;
}
async function openActivityDetail(id,focus=false){
  activityRunId=id;const request=++activityRequest,panel=$('#activity-detail'),body=$('#activity-detail-body');
  if(!panel.open)panel.showModal();$('#activity-detail-title').textContent='Run details';$('#activity-detail-status').textContent='Loading logs…';body.replaceChildren();
  if(focus)$('#activity-detail-close').focus({preventScroll:true});
  try{
    const run=await api(`/api/runs/${encodeURIComponent(id)}`);if(request!==activityRequest)return;
    $('#activity-detail-status').textContent=`${patternNames[run.pattern] || 'Test run'} · ${run.status}`;
    const metadata=el('dl',null,'activity-metadata');
    for(const [label,value] of [['Run ID',run.id],['Started',new Date(run.createdAt).toLocaleString()],['Finished',run.finishedAt?new Date(run.finishedAt).toLocaleString():'Not recorded'],['Provider',run.provider],['Model',run.model],['Stage',run.stage],['Verdict',run.verdict],['Jira reference',run.jira],['Input files',run.files?.join(', ')],['Source run',run.sourceRun]]){
      if(value){const item=el('div');item.append(el('dt',label),el('dd',value));metadata.append(item);}
    }
    body.append(metadata);
    const section=(title,text)=>{const block=el('section',null,'activity-log-section');block.append(el('h3',title),el('pre',text,'activity-log'));body.append(block);};
    if(run.prompt)section('Requirements / instructions',run.prompt);
    if(run.failure || run.error)section('Failure details',[run.failure?.reason,run.failure?.detail || run.error,run.failure?.action].filter(Boolean).join('\n\n'));
    if(run.response)section('Run summary',run.response);
    body.append(renderActivityActions(run.log));
    const artifacts=el('section',null,'activity-log-section');artifacts.append(el('h3','Generated files'));
    for(const artifact of run.artifacts || []){const link=el('a',artifact.path);link.href=`/api/runs/${encodeURIComponent(id)}/artifact?path=${encodeURIComponent(artifact.path)}&download=1`;artifacts.append(link);}
    if(!run.artifacts?.length)artifacts.append(el('p','No generated files recorded.'));body.append(artifacts);
    if(run.status==='running')$('#activity-detail-status').textContent+=' · Refresh logs to see the latest activity';
  }catch(e){if(request===activityRequest)$('#activity-detail-status').textContent=`Unable to load logs: ${e.message}`;}
}
$('#activity-page-size').onchange=e=>{activityPageSize=Number(e.target.value);activityPage=1;renderActivityTable();};
$('#activity-previous').onclick=()=>{activityPage--;renderActivityTable();};
$('#activity-next').onclick=()=>{activityPage++;renderActivityTable();};
$('#activity-detail-refresh').onclick=()=>{if(activityRunId)openActivityDetail(activityRunId);};
$('#activity-detail-close').onclick=()=>$('#activity-detail').close();
$('#activity-detail').addEventListener('close',()=>{activityRequest++;activityRunId=null;if(activityTrigger?.isConnected)activityTrigger.focus();else $('#refresh-runs').focus();});
async function selectRun(id){clearTimeout(timer);const previousId=current?.id;current=await api(`/api/runs/${id}`);if(previousId!==id){setPage(current.pattern==='10'?'execution':current.pattern==='11'?'data':'generation',false);tab=current.pattern==='10'?'execution':current.pattern==='11'?'data':current.pattern==='3'?'automation':current.pattern==='1'?'all':'manual';document.querySelectorAll('[data-tab]').forEach(t=>{t.classList.toggle('active',t.dataset.tab===tab);t.setAttribute('aria-selected',String(t.dataset.tab===tab));});}renderResults();$('#submit').disabled=current.status==='running';setWorkflowBusy(current.status==='running');$('#cancel').hidden=current.status!=='running';if(current.status==='running')timer=setTimeout(()=>selectRun(id).catch(e=>{error(e.message);$('#submit').disabled=false;}),1500);else await loadRunHistory();}
function isManual(a){return /(?:^|\/)(?:testcraft|sheetcraft)\//i.test(a.path) && /\.(md|txt|csv|xlsx|xls|pdf|docx)$/i.test(a.name);}function isAutomation(a){return /\.feature$/i.test(a.name);}
function parseManualCases(markdown,source){
  const blocks=markdown.split(/(?=^## Test Case\b)/m).filter(block=>/^## Test Case\b/m.test(block));
  const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const meta=(block,label)=>block.match(new RegExp(`^\\*\\*${escapeRegex(label)}\\*\\*:\\s*(.*)$`,'mi'))?.[1]?.trim() || '';
  const section=(block,title)=>{const match=block.match(new RegExp(`^###\\s+${escapeRegex(title)}\\s*\\r?\\n([\\s\\S]*?)(?=^###\\s|^##\\s|(?![\\s\\S]))`,'mi'));return match?.[1]?.trim() || '';};
  return blocks.map(block=>{
    const testData=section(block,'Test Data').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    return {source,id:meta(block,'TCID') || block.match(/^## Test Case\s+(.+)$/m)?.[1]?.trim() || '',summary:meta(block,'Test Summary'),component:meta(block,'Component'),priority:meta(block,'Priority'),category:meta(block,'Category'),scenario:meta(block,'Scenario'),functionalRequirement:meta(block,'Functional Requirement'),traceability:meta(block,'Business Rule Traceability'),description:section(block,'Description'),preconditions:section(block,'Pre-conditions'),steps:section(block,'Test Steps'),testData,expected:section(block,'Expected Result')};
  });
}
function renderManualTable(body,artifacts){
  const markdownFiles=artifacts.filter(a=>/(testcraft|sheetcraft)\//i.test(a.path) && /\.(md|txt)$/i.test(a.name));
  if(!markdownFiles.length)return false;
  const runId=current.id,panel=el('div',null,'manual-table-scroll'),table=el('table',null,'manual-case-table'),thead=document.createElement('thead'),header=document.createElement('tr');
  for(const label of ['TCID','Test summary','Component','Priority','Category','Traceability','Steps & data','Expected result'])header.append(el('th',label));
  thead.append(header);const tbody=document.createElement('tbody');table.append(thead,tbody);panel.append(table);body.append(panel);
  const cached=markdownFiles.map(a=>{const url=`/api/runs/${runId}/artifact?path=${encodeURIComponent(a.path)}`;let promise=manualCaseCache.get(url);if(!promise){promise=fetch(url).then(response=>{if(!response.ok)throw new Error('Could not read test case file');return response.text();}).then(text=>parseManualCases(text,a.name));manualCaseCache.set(url,promise);}return promise;});
  Promise.all(cached).then(groups=>{
    if(current?.id!==runId)return;
    tbody.replaceChildren();for(const test of groups.flat()){
      const row=document.createElement('tr');
      for(const value of [test.id,test.summary,test.component,test.priority,test.category,`FR: ${test.functionalRequirement || '—'}\nBR: ${test.traceability || '—'}`])row.append(el('td',value || '—'));
      const detailsCell=document.createElement('td'),details=document.createElement('details'),summary=el('summary','View preconditions, steps & data');
      details.append(summary);for(const [label,value] of [['Preconditions',test.preconditions],['Test steps',test.steps],['Test data',test.testData]])if(value){details.append(el('strong',label),el('pre',value));}
      detailsCell.append(details);row.append(detailsCell,el('td',test.expected || '—'));tbody.append(row);
    }
    if(!tbody.children.length){const row=document.createElement('tr'),cell=el('td','No detailed test case blocks were found. Use the source file preview below.');cell.colSpan=8;row.append(cell);tbody.append(row);}
  }).catch(error=>{if(current?.id===runId){const row=document.createElement('tr'),cell=el('td',`${error.message}. Use the source file preview below.`);cell.colSpan=8;row.append(cell);tbody.append(row);}});
  return true;
}
function isAutomationPack(a){return /^(bddautomator|automationforge|gherkeningenie|gherkingenie)\//i.test(a.path) && !/(^|\/)(bin|obj|TestResults|node_modules)\//i.test(a.path);}
function isExecution(a){return /(^runforge\/|\/TestResults\/|^codesentinel\/)/i.test(a.path);}
function isData(a){return /^testdataforge\//i.test(a.path);}
function renderResults(){
  if(typeof updateRunProgress==='function')updateRunProgress(current);
  const artifacts=current?.artifacts || [];
  $('#run-bdd-results').hidden=!current || current.status==='running' || !artifacts.some(a=>a.path==='bddautomator/AutomationFramework/AutomationFramework.csproj');
  $('#manual-count').textContent=artifacts.filter(isManual).length;
  $('#automation-count').textContent=artifacts.filter(isAutomation).length;
  $('#run-status').textContent=current?.failure?.reason || (current?({running:'Generating…',finished:'Run ended',failed:'Run failed',cancelled:'Run cancelled',interrupted:'Run interrupted',timed_out:'Run timed out',blocked:'Run blocked'}[current.status] || current.status):'Ready when you are');
  const body=$('#result-body');body.replaceChildren();
  const shown=artifacts.filter(a=>tab==='all' || (tab==='pack'?isAutomationPack(a):tab==='manual'?isManual(a):tab==='execution'?isExecution(a):tab==='data'?isData(a):isAutomation(a)));
  if(tab==='manual')renderManualTable(body,artifacts);
  if(tab==='pack' && shown.length){
    const pack=el('div',null,'artifact');const meta=el('div');meta.append(el('strong','Generated automation pack'),el('small','Framework, step definitions, configuration, and feature files'));
    pack.append(meta);
    if(current.status!=='running'){const download=el('a','Download pack (.zip) ↓');download.href=`/api/runs/${current.id}/automation-pack`;pack.append(download);}
    else pack.append(el('small','Download available when generation ends'));
    body.append(pack);
  }
  if(!shown.length){
    const empty=el('div',null,'empty');
    empty.append(el('div','▤','empty-icon'),el('strong',current?.status==='running'?'Your finance test assets are being generated':current?'No files in this category':'Your next finance journey starts here'),el('p',current?'Generated files will appear here with preview and download options.':'Add product rules or journey requirements to generate finance test cases and automation scenarios.'));
    body.append(empty);
  }
  for(const a of shown){
    const row=el('div',null,'artifact');row.append(el('span','▤'));
    const meta=el('div');meta.append(el('strong',a.name),el('small',`${Math.max(1,Math.round(a.size/1024))} KB`));row.append(meta);
    const url=`/api/runs/${current.id}/artifact?path=${encodeURIComponent(a.path)}`;
    if(/\.(md|txt|json|feature|cs|csv|xml|csproj|html|log)$/i.test(a.name)){
      const preview=el('button','Preview');preview.type='button';
      preview.onclick=async()=>{try{const r=await fetch(url);if(!r.ok)throw new Error('Unable to load preview');$('#preview-title').textContent=a.name;$('#preview-text').textContent=await r.text();$('#preview').showModal();}catch(e){error(e.message);}};
      row.append(preview);
    }
    const download=el('a','Download ↓');download.href=url+'&download=1';row.append(download);body.append(row);
  }
  if(current && (current.response || current.log || current.failure || current.error)){
    const details=el('details',null,'run-details');
    details.append(el('summary','Run details'));
    if(current.failure || current.error)details.append(el('p',current.failure?.detail || current.error),el('p',current.failure?.action || ''));
    if(current.response)details.append(el('pre',current.response,'activity'));
    if(current.log)details.append(el('pre',current.log,'activity'));
    body.append(details);
  }
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-selected',String(t===b));});renderResults();});$('#close-preview').onclick=()=>$('#preview').close();$('#cancel').onclick=async()=>{try{await api(`/api/runs/${current.id}/cancel`,{method:'POST'});await selectRun(current.id);}catch(e){error(e.message);}};$('#new-run').onclick=()=>{setPage('generation',false);if(current?.status==='running'){$('#prompt').focus();return;}clearTimeout(timer);current=null;files=[];$('#run-form').reset();$('#jira-input').hidden=true;toggleInputMenu(false);choose('4');renderFiles();renderResults();error('');$('#submit').disabled=false;$('#cancel').hidden=true;$('#prompt').focus();};
route();renderResults();Promise.all([api('/api/config'),loadRunHistory()]).then(([config,runs])=>{for(const selector of ['#run-runner','#execution-runner','#data-runner']){const picker=$(selector);picker.value=config.provider==='copilot'?'copilot':'codex';picker.dispatchEvent(new Event('change'));}$('#connection').textContent=config.runner?`${config.runnerLabel || 'Copilot CLI'} available`:`${config.runnerLabel || 'Copilot CLI'} not found`;if(!config.jira)$('#jira-help').textContent='Jira setup needed: configure the server in .vscode/mcp.json.';const running=runs.find(r=>r.status==='running');if(running && !['#dashboard','#recent'].includes(location.hash))selectRun(running.id).catch(e=>error(e.message));}).catch(e=>error(e.message));
