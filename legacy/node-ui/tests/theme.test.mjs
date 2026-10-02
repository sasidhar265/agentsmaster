import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../QaStudio.Web/wwwroot/app.js',import.meta.url),'utf8');
const bootstrap=app.split('// QA workspace application')[0];
function browser({saved=null,ready='loading',storageBlocked=false}={}) {
 const events={},windowEvents={};let onChange;const store=new Map(saved?[['qa-theme',saved]]:[]);
 const picker={attributes:{},setAttribute(name,value){this.attributes[name]=value;},addEventListener(name,handler){if(name==='click')onChange=handler;}};
 const context={document:{readyState:ready,documentElement:{dataset:{}},getElementById:()=>picker,addEventListener:(name,handler)=>events[name]=handler},window:{matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener:(name,handler)=>windowEvents[name]=handler},localStorage:{getItem:key=>{if(storageBlocked)throw Error('Storage blocked');return store.get(key);},setItem:(key,value)=>{if(storageBlocked)throw Error('Storage blocked');store.set(key,value);}}};
 vm.runInNewContext(bootstrap,context);if(ready==='loading')events.DOMContentLoaded();
 return {context,picker,store,toggle(){onChange();},windowEvents};
}
test('theme is delivered in the existing app route without requiring a new server route',()=>{
 const html=fs.readFileSync(new URL('../QaStudio.Web/Views/Shared/_Layout.cshtml',import.meta.url),'utf8');assert.doesNotMatch(html,/src="\/theme\.js/);assert.match(html,/src="~\/app\.js"/);assert.match(bootstrap,/qa-theme/);
});
test('theme icon switch toggles and persists both before and after DOMContentLoaded',()=>{
 for(const ready of ['loading','interactive','complete']){
  const b=browser({saved:'light',ready});assert.equal(b.context.document.documentElement.dataset.theme,'light');b.toggle();assert.equal(b.context.document.documentElement.dataset.theme,'dark');assert.equal(b.store.get('qa-theme'),'dark');b.toggle();assert.equal(b.context.document.documentElement.dataset.theme,'light');
 }
});
test('system preference, unavailable storage, and cross-tab theme updates work',()=>{
 const b=browser({storageBlocked:true,ready:'complete'});assert.equal(b.picker.attributes['aria-checked'],'true');b.toggle();assert.equal(b.context.document.documentElement.dataset.theme,'light');
 b.windowEvents.storage({key:'qa-theme',newValue:'dark'});assert.equal(b.picker.attributes['aria-checked'],'true');
});
