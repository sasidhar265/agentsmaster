import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('workflow submission preserves browser history and sends the selected pattern',async()=>{
 const nodes=new Map();
 const node=()=>({value:'',checked:false,dataset:{},classList:{toggle(){}},append(){},replaceChildren(){},setAttribute(){},removeAttribute(){},addEventListener(){},scrollIntoView(){},showModal(){this.open=true;},close(value=''){this.returnValue=value;this.open=false;this.onclose?.();}});
 const get=selector=>{if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);};
 const buttons=['2','3','4'].map(pattern=>({...node(),dataset:{workflow:pattern}}));
 const requests=[],timers=[];
 const context=vm.createContext({console,location:{hash:''},document:{readyState:'loading',documentElement:{dataset:{}},addEventListener(){},getElementById:get,createElement:node,querySelector:get,querySelectorAll:s=>s==='[data-workflow]'?buttons:[]},localStorage:{getItem(){return null;}},CustomEvent:class{},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},fetch:async(url,options)=>{
  let data={};
  if(url==='/api/config')data={runner:true,jira:true};
  else if(url==='/api/resources')data={frameworks:[],payloads:[]};
  else if(url==='/api/runs' && !options)data=[];
  else if(url==='/api/runs'){const payload=JSON.parse(options.body);requests.push(payload);data={id:payload.pattern};}
  else data={id:url.split('/').at(-1),pattern:url.split('/').at(-1),status:'running',artifacts:[]};
  return {ok:true,json:async()=>data};
 }});
 context.window=context;context.addEventListener=()=>{};context.dispatchEvent=()=>{};
 const nativeHistory={replaceState(_state,_title,hash){context.location.hash=hash;}};
 context.history=nativeHistory;
 for(const file of ['app.js','workflows.js'])vm.runInContext(fs.readFileSync(new URL(`../QaStudio.Web/wwwroot/${file}`,import.meta.url),'utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(context.history,nativeHistory);
 for(const button of buttons){
  get('#analysis').checked=true;
  button.onclick();get('#prompt').value='Generate tests for this requirement';
  const count=requests.length;
  const submission=get('#run-form').onsubmit({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,count,'agents must not start before OK');
  assert.equal(get('#pattern-confirmation').open,true);
  assert.match(get('#pattern-title').textContent,new RegExp(`Pattern ${button.dataset.workflow}`));
  assert.equal(get('#pattern-request').textContent,'Generate tests for this requirement');
  assert.match(get('#pattern-agents').textContent,/QA-Master → SpecForge/);
  get('#pattern-confirmation').close('ok');
  await submission;
  assert.equal(requests.at(-1).pattern,button.dataset.workflow);
  assert.equal(get('#error').textContent,'');
  assert.equal(context.location.hash,'#generation');
 }
 assert.equal(timers.length,3,'each submitted run starts monitoring');
 for(const value of ['cancel','']){
  const submission=get('#run-form').onsubmit({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));
  get('#pattern-confirmation').close(value);
  await submission;
  assert.equal(requests.length,3,'Cancel and Escape must not start agents');
 }
 get('#prompt').value='';
 await get('#run-form').onsubmit({preventDefault(){}});
 assert.equal(requests.length,3);
 assert.equal(get('#error').textContent,'Add a prompt, a file, or a Jira reference.');
 context.setPage('recent');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(context.location.hash,'#recent');
 assert.equal(get('#recent-page').hidden,false);
 assert.equal(get('#generation-page').hidden,true);
 assert.equal(get('#results').hidden,true);
 assert.equal(get('h1').textContent,'Recent runs.');
 await context.selectRun('3');
 assert.equal(context.location.hash,'#generation');
 assert.equal(get('#recent-page').hidden,true);
 assert.equal(get('#results').hidden,false);
});
