let progressRunId=null,progressLastStatus=null;
function updateRunProgress(run){
 const dialog=document.getElementById('run-progress'),opener=document.getElementById('show-progress');
 opener.hidden=!run || run.status!=='running';if(!run){if(dialog.open)dialog.close();progressRunId=null;progressLastStatus=null;return;}
 const changed=progressRunId!==run.id,failed=!!run.failure;
 dialog.dataset.state=failed?'failed':run.status;
 const journey=run.progress || [];
 document.getElementById('progress-phase').textContent=failed?'ACTION NEEDED':run.status==='running'?'LIVE ORCHESTRATION':'WORKFLOW SUMMARY';
 for(const [id,statuses] of [['active',['running']],['complete',['completed']],['pending',['pending','unconfirmed']]])document.getElementById(`progress-${id}`).textContent=journey.filter(agent=>statuses.includes(agent.status)).length;
 document.getElementById('progress-workflow').textContent=({'1':'Finance requirements analysis','2':'Finance test cases','3':'Finance automation','4':'End-to-end finance coverage','10':'Finance test execution','11':'Finance test data','12':'BRD domain and outcome review'})[run.pattern] || 'Finance agent workflow';
 document.getElementById('progress-title').textContent=failed?run.failure.reason:run.status==='running'?'Generation in progress':'Run ended';
 document.getElementById('progress-summary').textContent=`Pattern ${run.pattern} · ${run.status}${run.stage?' · '+run.stage:''}`;
 const failure=document.getElementById('progress-failure');failure.hidden=!failed;failure.replaceChildren();
 if(failed)for(const text of [run.failure.detail,run.failure.action]){const p=document.createElement('p');p.textContent=text;failure.append(p);}
 const agents=document.getElementById('progress-agents');agents.replaceChildren();
 for(const agent of run.progress || []){
  const card=document.createElement('section');card.className='progress-agent';card.dataset.status=agent.status;
  const badge=document.createElement('span');badge.className='progress-status';badge.textContent=({pending:'Pending',running:'Running',completed:'Reported complete',blocked:'Blocked',stopped:'Stopped',unconfirmed:'Not confirmed'})[agent.status];
  const marker=document.createElement('span');marker.className='progress-agent-marker';marker.textContent=agent.status==='completed'?'✓':String((run.progress || []).indexOf(agent)+1).padStart(2,'0');
  const heading=document.createElement('div');heading.className='progress-agent-heading';
  const title=document.createElement('h3');title.textContent=agent.name;heading.append(title,badge);
  const description=document.createElement('p');description.textContent=agent.description;
  const tasks=document.createElement('ul');for(const task of agent.tasks){const item=document.createElement('li');item.textContent=task;tasks.append(item);}
  const content=document.createElement('div');content.className='progress-agent-content';const caption=document.createElement('span');caption.className='progress-task-caption';caption.textContent='PLANNED TASKS';content.append(heading,description,caption,tasks);card.append(marker,content);agents.append(card);
 }
 document.getElementById('progress-log').textContent=run.log || 'Waiting for runner activity…';
 document.getElementById('progress-cancel').hidden=run.status!=='running';
 document.getElementById('progress-dismiss').textContent=run.status==='running'?'Continue in background':'Close';
 if(run.status!=='running'){if(dialog.open)dialog.close();}
 else if(changed && !dialog.open)dialog.showModal();
 progressRunId=run.id;progressLastStatus=run.status;
}
document.addEventListener('DOMContentLoaded',()=>{
 const dialog=document.getElementById('run-progress');
 document.getElementById('show-progress').onclick=()=>dialog.showModal();
 for(const id of ['close-progress','progress-dismiss'])document.getElementById(id).onclick=()=>dialog.close();
 document.getElementById('progress-cancel').onclick=()=>document.getElementById('cancel').click();
});
