import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('results prioritize selected deliverables and keep agent details collapsed',()=>{
 const nodes=new Map();
 const el=(tag,text='',cls='')=>({tag,textContent:text,className:cls,children:[],append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},setAttribute(){}});
 const $=key=>{if(!nodes.has(key))nodes.set(key,el('div'));return nodes.get(key);};
 const context=vm.createContext({$,el,current:{id:'fixture',status:'finished',response:'Final response <script> stays text',artifacts:[]},tab:'automation'});
 const source=fs.readFileSync(new URL('../QaStudio.Web/wwwroot/app.js',import.meta.url),'utf8');
 vm.runInContext(source.slice(source.indexOf('function isManual('),source.indexOf("document.querySelectorAll('[data-tab]').forEach(b=>b.onclick")),context);
 context.renderResults();
 const texts=node=>[node.textContent,...node.children.flatMap(texts)].join('\n');
 const details=$('#result-body').children.find(node=>node.tag==='details');
 assert.ok(details);assert.ok(!details.open);assert.match(texts(details),/Final response <script> stays text/);
 context.current.response='';context.current.artifacts=[{path:'specforge/rules.md',name:'rules.md',size:42}];
 context.renderResults();assert.match(texts($('#result-body')),/No files in this category/);assert.doesNotMatch(texts($('#result-body')),/rules.md/);
 context.current.artifacts.push({path:'gherkeningenie/example.feature',name:'example.feature',size:42});
 context.renderResults();
 assert.match(texts($('#result-body')),/example.feature/);assert.match(texts($('#result-body')),/Preview/);assert.match(texts($('#result-body')),/Download/);
 assert.doesNotMatch(texts($('#result-body')),/rules.md/);
 const row=$('#result-body').children.find(node=>node.className==='artifact');
 assert.equal(row.children.find(node=>node.tag==='a').href,'/api/runs/fixture/artifact?path=gherkeningenie%2Fexample.feature&download=1');
 context.tab='all';context.renderResults();assert.match(texts($('#result-body')),/rules.md/);
 context.tab='manual';context.current.artifacts.push({path:'testcraft/tests.md',name:'tests.md',size:42},{path:'sheetcraft/tests.xlsx',name:'tests.xlsx',size:42});
 context.renderResults();assert.match(texts($('#result-body')),/tests.md/);assert.match(texts($('#result-body')),/tests.xlsx/);assert.doesNotMatch(texts($('#result-body')),/example.feature/);
});
