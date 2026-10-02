import {test} from 'node:test';
import assert from 'node:assert/strict';
import {failureDetails,runProgress} from '../lib/run-progress.mjs';
test('failure explanations expose quota and agent errors for existing runs',()=>{
 assert.equal(failureDetails({status:'failed'},'You have exceeded your monthly quota').reason,'Copilot quota exceeded');
 assert.equal(failureDetails({status:'finished',provider:'copilot'},'You have exceeded your monthly quota').reason,'Copilot quota exceeded');
 assert.equal(failureDetails({status:'failed',provider:'codex'},'You’ve hit your usage limit.').reason,'Codex quota exceeded');
 assert.match(failureDetails({status:'failed'},"Custom agent 'QA-Master' failed to load: bad YAML").detail,/bad YAML/);
 assert.equal(failureDetails({status:'running'},'quota exceeded'),null);
 assert.equal(failureDetails({status:'timed_out'},'').reason,'Generation timed out');
});
test('agent progress requires explicit events and supports parallel work and rework',()=>{
 const agents=['SpecForge','TestCraft','GherkinGenie'];
 let progress=runProgress({status:'running'},'Planning SpecForge, TestCraft, GherkinGenie',agents);
 assert.deepEqual(progress.map(a=>a.status),['running','pending','pending','pending']);
 const log='QA_PROGRESS SpecForge started\nQA_PROGRESS SpecForge completed\nQA_PROGRESS TestCraft started\nQA_PROGRESS GherkinGenie started\n';
 progress=runProgress({status:'running'},log,agents);
 assert.deepEqual(progress.map(a=>a.status),['running','completed','running','running']);
 assert.equal(runProgress({status:'running'},log+'QA_PROGRESS SpecForge started\n',agents)[1].status,'running');
 assert.deepEqual(runProgress({status:'failed'},log,agents).map(a=>a.status),['unconfirmed','completed','stopped','stopped']);
 assert.equal(runProgress({status:'finished'},'',agents)[1].status,'unconfirmed');
});

test('progress dialog opens on generation, stays dismissed during polling, and closes when execution ends',async()=>{
 const fs=await import('node:fs/promises'),vm=await import('node:vm');
 const nodes=new Map();const element=()=>({open:false,children:[],dataset:{},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},showModal(){this.open=true;},close(){this.open=false;}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 const context=vm.createContext({document:{getElementById:get,createElement:element,addEventListener(){}}});
 vm.runInContext(await fs.readFile(new URL('../QaStudio.Web/wwwroot/progress.js',import.meta.url),'utf8'),context);
 const run={id:'test',pattern:'2',status:'running',progress:runProgress({status:'running'},'',['SpecForge'])};
 context.updateRunProgress(run);assert.equal(get('run-progress').open,true);
 get('run-progress').close();context.updateRunProgress(run);assert.equal(get('run-progress').open,false);
 run.status='failed';run.failure=failureDetails(run,'You have exceeded your monthly quota');context.updateRunProgress(run);
 assert.equal(get('run-progress').open,false);assert.equal(get('show-progress').hidden,true);assert.equal(get('progress-title').textContent,'Copilot quota exceeded');
 const next={...run,id:'next',status:'running',failure:null};context.updateRunProgress(next);assert.equal(get('run-progress').open,true);
 next.status='finished';context.updateRunProgress(next);assert.equal(get('run-progress').open,false);
 assert.equal(get('progress-cancel').hidden,true);
 context.updateRunProgress(null);assert.equal(get('run-progress').open,false);
});
