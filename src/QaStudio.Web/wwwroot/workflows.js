let page='home';
function setWorkflowBusy(busy){$('#execute-submit').disabled=busy;$('#data-submit').disabled=busy;}
function setPage(next, reset=true){
  page=['home','generation','execution','data','dashboard','recent'].includes(next)?next:'home';
  for(const name of ['home','generation','execution','data','dashboard','recent'])$(`#${name}-page`).hidden=name!==page;
  document.querySelectorAll('[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===page);if(a.dataset.page===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#new-run').classList.toggle('active',page==='generation');
  if(page==='generation')$('#new-run').setAttribute('aria-current','page');else $('#new-run').removeAttribute('aria-current');
  const titles={home:['Auto finance quality hub.','Explore finance products, understand the lifecycle, and build coverage for customer and dealer journeys.','Home'],recent:['Project activity.','Review delivery work, journey evidence, and generated project assets.','Project activity'],dashboard:['Auto Finance Transformation.','Track delivery health, workstreams, quality gates, risks, activity, and execution evidence.','Project overview'],generation:['From finance journeys to confidence.','Test customer, dealer, credit, agreement, payment, and servicing journeys.','Requirements'],execution:['Put finance automation to the test.','Run an existing framework and turn journey execution into clear evidence.','Test execution'],data:['Representative data. More meaningful tests.','Generate source-grounded customer, vehicle, quote, and agreement datasets.','Test data']};
  const [title,subtitle,crumb]=titles[page];$('h1').textContent=title;$('.heading p').textContent=subtitle;$('.breadcrumb strong').textContent=crumb;$('#results h2').textContent=page==='execution'?'Execution results':page==='data'?'Generated test data':'Test results';
  for(const button of document.querySelectorAll('[data-tab]')) button.hidden=!['all','activity',...(page==='generation'?['manual','automation','pack']:page==='execution'?['execution','pack']:[page])].includes(button.dataset.tab);
  if(reset){clearTimeout(timer);current=null;tab=page==='generation'?'manual':page;$('#cancel').hidden=true;renderResults();if(['execution','data'].includes(page)){$('#result-body .empty strong').textContent=page==='execution'?'Your execution evidence will appear here':'Your generated datasets will appear here';$('#result-body .empty p').textContent=page==='execution'?'Select a framework above to validate and run your automation.':'Select or upload a source payload to generate test data.';}}
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));});
  if(location.hash!==`#${page}`)window.history.replaceState(null,'',`#${page}`);
  $('#results').hidden=['home','dashboard','recent'].includes(page);
  window.dispatchEvent(new CustomEvent('qa-page-change',{detail:page}));
  if(page==='recent')loadRunHistory().catch(e=>workflowError('recent',e.message));
  refreshResources().catch(e=>workflowError(page,e.message));
}
function workflowError(view,message){const target=view==='generation'?$('#error'):$(`#${view}-error`);target.hidden=!message;target.textContent=message;}
async function refreshResources(){
  const resources=await api('/api/resources');
  for(const [selector,items,placeholder] of [['#framework-source',resources.frameworks,'Select an automation framework'],['#payload-source',resources.payloads,'Upload a new JSON payload']]){
    const select=$(selector),previous=select.value;select.replaceChildren();const empty=el('option',items.length?placeholder:selector==='#framework-source'?'No frameworks yet — generate automation first':placeholder);empty.value='';select.append(empty);
    for(const item of items){const option=el('option',item.label);option.value=item.id;select.append(option);}if(items.some(i=>i.id===previous))select.value=previous;
  }
  $('#payload-upload-fields').hidden=!!$('#payload-source').value;
  const runs=await api('/api/runs');const busy=runs.some(r=>r.status==='running');setWorkflowBusy(busy);$('#submit').disabled=busy;
}
async function submitWorkflow(view,payload){
  if(payload.executionMode!=='bdd')Object.assign(payload,view==='data'?dataModel():executionModel());
  workflowError(view,'');setWorkflowBusy(true);$('#submit').disabled=true;
  try{if(payload.executionMode!=='bdd' && !await confirmPattern(payload)){await refreshResources();return;}const run=await api('/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});await selectRun(run.id);await loadRunHistory();$('#results').scrollIntoView({behavior:'smooth',block:'start'});}
  catch(e){workflowError(view,e.message);await refreshResources().catch(()=>{});}
}
function updateExecutionMode(){const direct=$('#execution-mode').value==='bdd';$('#bdd-options').hidden=!direct;$('#agent-execution-options').hidden=direct;$('#execution-form .model-picker').hidden=direct;$('#bdd-execution-guide').hidden=!direct;$('#agent-execution-guide').hidden=direct;$('#execute-submit').textContent=direct?'Run BDD tests →':'Validate & execute →';}
$('#execution-mode').onchange=updateExecutionMode;
$('#execution-form').onsubmit=e=>{e.preventDefault();const direct=$('#execution-mode').value==='bdd';submitWorkflow('execution',{pattern:'10',executionMode:$('#execution-mode').value,sourceRun:$('#framework-source').value,configuration:$('#bdd-configuration').value,testFilter:$('#bdd-filter').value,prompt:direct?'Run auto finance BDD tests'+($('#bdd-filter').value.trim()?': '+$('#bdd-filter').value.trim():''):$('#execution-prompt').value.trim() || 'Validate and execute the selected auto finance automation framework and publish journey evidence.'});};
$('#run-bdd-results').onclick=async()=>{const source=current?.id;setPage('execution');$('#execution-mode').value='bdd';updateExecutionMode();try{await refreshResources();$('#framework-source').value=source;$('#execute-submit').focus();}catch(e){workflowError('execution',e.message);}};
$('#data-form').onsubmit=async e=>{
  e.preventDefault();workflowError('data','');
  try{
    const payload={pattern:'11',payloadId:$('#payload-source').value,prompt:$('#data-prompt').value.trim() || 'Generate grounded auto finance test data from the selected source payload.'};
    if(!payload.payloadId){
      const source=$('#source-payload-file').files[0],schema=$('#payload-schema-file').files[0];
      if(!source)throw new Error('Choose a source payload JSON file.');
      for(const file of [source,schema].filter(Boolean))if(file.size>10*1024*1024)throw new Error('JSON files must be 10 MB or smaller.');
      payload.baseName=$('#data-base-name').value.trim();payload.sourcePayload=await source.text();payload.payloadSchema=schema?await schema.text():'';
    }
    await submitWorkflow('data',payload);
  }catch(e){workflowError('data',e.message);}
};
$('#payload-source').onchange=()=>{$('#payload-upload-fields').hidden=!!$('#payload-source').value;};
$('#refresh-runs').onclick=()=>{workflowError('recent','');loadRunHistory().catch(e=>workflowError('recent',e.message));};
$('#refresh-frameworks').onclick=()=>refreshResources().catch(e=>workflowError('execution',e.message));
document.querySelectorAll('[data-page]').forEach(a=>a.onclick=e=>{e.preventDefault();setPage(a.dataset.page);});
window.addEventListener('hashchange',()=>setPage(location.hash.slice(1)));
setPage(location.hash.slice(1));
