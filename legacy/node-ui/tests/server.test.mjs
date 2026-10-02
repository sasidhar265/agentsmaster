import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {server,jiraKey,patterns} from '../server.mjs';
let base;
before(async()=>{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});base=`http://127.0.0.1:${server.address().port}`;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('Jira inputs normalize keys, browse links and numeric references',()=>{
 assert.equal(jiraKey('gqs-1'),'GQS-1');assert.equal(jiraKey('https://example.atlassian.net/browse/GQS-42?x=1'),'GQS-42');assert.equal(jiraKey('12','gqs'),'GQS-12');assert.throws(()=>jiraKey('12'));assert.throws(()=>jiraKey('https://evil.test/GQS-1'));assert.equal(jiraKey(''),'');
});
test('Workflow patterns include mandatory validation and export stages',()=>{assert.deepEqual(patterns['2'],['SpecForge','TestCraft','QualitySentinel','SheetCraft']);assert.equal(patterns['3'].at(-1),'RunForge');assert.ok(patterns['4'].includes('FeatureLens'));});
test('backend is API-only and refuses private workspace files',async()=>{assert.equal((await fetch(base)).status,404);assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/.github/agents/QA-Master.agent.md')).status,404);});
test('rejects foreign origins and malformed requests',async()=>{
 const post=(body,extra={})=>fetch(base+'/api/runs',{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
 assert.equal((await post({pattern:'4'},{Origin:'https://evil.test'})).status,403);
 assert.equal((await post({pattern:'4'})).status,400);
 assert.equal((await post({pattern:'99',prompt:'test'})).status,400);
 assert.equal((await post({pattern:'4',files:[{name:'../secret.txt',data:'YWJj'}]})).status,400);
 assert.equal((await post({pattern:'4',files:[{name:'payload.exe',data:'YWJj'}]})).status,400);
});
test('unknown runs cannot expose paths',async()=>{assert.equal((await fetch(base+'/api/runs/not-a-run')).status,400);});

test('execution and data workflows expose their specialist routes and reject missing sources',async()=>{
 assert.deepEqual(patterns['10'],['CodeSentinel','RunForge']);
 assert.deepEqual(patterns['11'],['TestDataForge']);
 const resourceResponse=await fetch(base+'/api/resources');assert.equal(resourceResponse.status,200);
 const resources=await resourceResponse.json();assert.ok(Array.isArray(resources.frameworks));assert.ok(Array.isArray(resources.payloads));
 for(const body of [{pattern:'10',sourceRun:'../../escape'},{pattern:'11',payloadId:'../escape'},{pattern:'11',baseName:'demo',sourcePayload:'not json'},{pattern:'11',baseName:'../escape',sourcePayload:'{}'}]){
  const response=await fetch(base+'/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,400);
 }
});

test('specialist requests stage exact inputs and omit previous execution evidence',async()=>{
 const fs=await import('node:fs/promises');const path=await import('node:path');const os=await import('node:os');const {randomUUID}=await import('node:crypto');
 const root=path.resolve('.qa-runs');const sourceId=randomUUID();const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'qa-runner-test-'));const runner=path.join(temporary,'runner');const ids=[sourceId];const previous=process.env.QA_COPILOT_BIN,previousProvider=process.env.QA_RUNNER;
 await fs.writeFile(runner,`#!/usr/bin/env node\nconst fs=require('node:fs');\nconst usageIndex=process.argv.indexOf('--usage-output-file');\nif(usageIndex<0)process.exit(2);\nfs.writeFileSync(process.argv[usageIndex+1],JSON.stringify({modelMetrics:{fixture:{usage:{inputTokens:100,outputTokens:20,cacheReadTokens:0,cacheWriteTokens:0}}}}));\nconst args=process.argv.slice(2);if(args[args.indexOf('--agent')+1]!=='QA-Master')process.exit(3);\nconst agent=fs.readFileSync('.github/agents/QA-Master.agent.md','utf8');if(!agent.startsWith('---\\n'))process.exit(4);\nconsole.log('Fixture runner: request received. No tests executed.');\n`);await fs.chmod(runner,0o700);process.env.QA_COPILOT_BIN=runner;process.env.QA_RUNNER='copilot';
 try{
  const source=path.join(root,sourceId);const framework=path.join(source,'workspace/output/bddautomator/AutomationFramework');
  await fs.mkdir(path.join(framework,'TestResults'),{recursive:true});
  await fs.writeFile(path.join(source,'run.json'),JSON.stringify({id:sourceId,status:'finished',pattern:'3',prompt:'Test fixture',createdAt:new Date().toISOString()}));
  await fs.writeFile(path.join(framework,'AutomationFramework.csproj'),'<Project />');
  await fs.writeFile(path.join(framework,'appsettings.json'),'{"fixture":true}');
  await fs.writeFile(path.join(framework,'TestResults/stale.trx'),'previous results');
  for(const payload of [{pattern:'2',prompt:'Manual tests'},{pattern:'3',prompt:'Automation tests'},{pattern:'4',prompt:'Full coverage'},{pattern:'10',sourceRun:sourceId},{pattern:'11',baseName:'fixture',sourcePayload:'{"identifier":"keep-me"}',payloadSchema:'{"type":"object"}'}]){
   const response=await fetch(base+'/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const run=await response.json();assert.equal(response.status,201,JSON.stringify(run));ids.push(run.id);
   const runDir=path.join(root,run.id);const request=await fs.readFile(path.join(runDir,'request.txt'),'utf8');
   if(payload.pattern==='10'){
    assert.match(request,/CodeSentinel must validate before RunForge/);
    const copied=path.join(runDir,'workspace/output/bddautomator/AutomationFramework');
    assert.equal(await fs.readFile(path.join(copied,'appsettings.json'),'utf8'),'{"fixture":true}');
    await assert.rejects(fs.access(path.join(copied,'TestResults/stale.trx')));
   }else if(payload.pattern==='11'){
    assert.match(request,/Pattern 11 only via TestDataForge/);
    assert.equal(await fs.readFile(path.join(runDir,'workspace/input/fixture-SourcePayload.json'),'utf8'),payload.sourcePayload);
    assert.equal(await fs.readFile(path.join(runDir,'workspace/input/fixture-PayloadSchema.json'),'utf8'),payload.payloadSchema);
   }
   assert.ok(request.includes(`Execute canonical Pattern ${payload.pattern}.`));
   for(const reference of ['bdd-framework-examples.md','jira-setup-and-examples.md','sheetcraft-exporter-example.md']){
    const relative=path.join('.github','agent-reference',reference);
    assert.equal(await fs.readFile(path.join(runDir,'workspace',relative),'utf8'),await fs.readFile(relative,'utf8'),'agent reference must be available in the run workspace');
   }
   let status='running';for(let attempt=0;attempt<100 && status==='running';attempt++){await new Promise(resolve=>setTimeout(resolve,25));status=(await (await fetch(base+`/api/runs/${run.id}`)).json()).status;}
   assert.equal(status,'finished');
   const dashboardResponse=await fetch(base+`/api/runs/${run.id}/dashboard`);assert.equal(dashboardResponse.status,200);const dashboard=await dashboardResponse.json();assert.equal(dashboard.usage.totalTokens,120);assert.equal(dashboard.counts.passed,0);
   assert.equal((await fetch(base+`/api/runs/${run.id}/dashboard?report=../../escape.trx`)).status,400);
  }
 }finally{
  if(previousProvider===undefined)delete process.env.QA_RUNNER;else process.env.QA_RUNNER=previousProvider;
  if(previous===undefined)delete process.env.QA_COPILOT_BIN;else process.env.QA_COPILOT_BIN=previous;
  for(const id of ids)await fs.rm(path.join(root,id),{recursive:true,force:true});
  await fs.rm(temporary,{recursive:true,force:true});
 }
});

test('direct BDD API executes the backend stages, captures real process outcomes, supports filters and cancellation',async()=>{
 const fs=await import('node:fs/promises');const path=await import('node:path');const os=await import('node:os');const {randomUUID}=await import('node:crypto');
 const root=path.resolve('.qa-runs'),sourceId=randomUUID(),ids=[sourceId];const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'qa-dotnet-test-'));const runner=path.join(temporary,'dotnet-fixture');
 const previous=process.env.QA_DOTNET_BIN,previousMode=process.env.QA_BDD_FIXTURE_MODE;
 await fs.writeFile(runner,`#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path');const args=process.argv.slice(2),command=args[0],mode=process.env.QA_BDD_FIXTURE_MODE;
fs.appendFileSync('fixture-commands.jsonl',JSON.stringify(args)+'\\n');
if(command==='--list-sdks'){console.log('8.0.408 [fixture]');process.exit(0);}
if(command==='build' && mode==='build-fail'){console.error('Fixture compiler error');process.exit(1);}
if(command==='test'){
 if(mode==='slow'){console.log('Fixture waiting for cancellation');setInterval(()=>{},1000);}
 else if(mode==='empty'){console.log('No matching tests');}
 else{const dir=args[args.indexOf('--results-directory')+1];fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'bdd.trx'),'<TestRun><Results><UnitTestResult testId="fixture" testName="Fixture scenario" outcome="'+(mode==='fail'?'Failed':'Passed')+'" duration="00:00:01"><Output><ErrorInfo><Message>Fixture assertion details</Message></ErrorInfo></Output></UnitTestResult></Results></TestRun>');if(mode==='fail')process.exit(1);}
}
`);await fs.chmod(runner,0o700);process.env.QA_DOTNET_BIN=runner;
 const source=path.join(root,sourceId),framework=path.join(source,'workspace/output/bddautomator/AutomationFramework');
 const post=payload=>fetch(base+'/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:'10',executionMode:'bdd',sourceRun:sourceId,...payload})});
 const wait=async(id,predicate)=>{for(let i=0;i<200;i++){const run=await (await fetch(base+`/api/runs/${id}`)).json();if(predicate(run))return run;await new Promise(resolve=>setTimeout(resolve,25));}throw new Error('Fixture run did not reach expected state');};
 try{
  await fs.mkdir(path.join(framework,'Input'),{recursive:true});await fs.writeFile(path.join(framework,'AutomationFramework.csproj'),'<Project />');await fs.writeFile(path.join(framework,'appsettings.json'),'{}');await fs.writeFile(path.join(framework,'Input/TestData.json'),'{}');await fs.writeFile(path.join(source,'run.json'),JSON.stringify({id:sourceId,status:'finished',pattern:'3',prompt:'BDD fixture',createdAt:new Date().toISOString()}));
  for(const options of [{configuration:'Release; bad'},{testFilter:'line\nbreak'},{executionMode:'invalid'}])assert.equal((await post(options)).status,400);
  for(const [mode,expected] of [['pass','finished'],['fail','failed'],['empty','blocked'],['build-fail','failed'],['slow','cancelled'],['placeholder','blocked'],['missing-sdk','blocked']]){
   process.env.QA_BDD_FIXTURE_MODE=mode;
   await fs.writeFile(path.join(framework,'appsettings.json'),mode==='placeholder'?'{"Api":{"Token":"REPLACE_WITH_SECRET"}}':'{}');
   process.env.QA_DOTNET_BIN=mode==='missing-sdk'?path.join(temporary,'missing-dotnet'):runner;
   const filter='FullyQualifiedName~Quote&Name!~$(touch injected)';const response=await post({testFilter:filter,configuration:'Debug'});const created=await response.json();assert.equal(response.status,201,JSON.stringify(created));ids.push(created.id);
   if(mode==='slow'){
    await wait(created.id,r=>r.stage==='testing');assert.equal((await post({})).status,409);
    assert.equal((await fetch(base+`/api/runs/${created.id}/cancel`,{method:'POST'})).status,200);
   }
   const completed=await wait(created.id,r=>r.status!=='running');assert.equal(completed.status,expected,completed.error);
   // Final artifact persistence completes before the single-run lock is released.
   for(let i=0;i<100;i++){if(completed.finishedAt && (await fs.readdir(path.join(root,created.id,'workspace/output/runforge')).catch(()=>[])).length>=2)break;await new Promise(resolve=>setTimeout(resolve,10));}
   const dashboard=await (await fetch(base+`/api/runs/${created.id}/dashboard`)).json();assert.equal(dashboard.usage.totalTokens,0);assert.equal(dashboard.usage.applicable,false);
   const runFramework=path.join(root,created.id,'workspace/output/bddautomator/AutomationFramework');
   if(mode==='pass' || mode==='fail'){
    const commands=(await fs.readFile(path.join(runFramework,'fixture-commands.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(commands.map(args=>args[0]),['--list-sdks','restore','build','test']);assert.equal(commands[3][commands[3].indexOf('--filter')+1],filter);assert.ok(commands[3].includes('Debug'));
    assert.equal(dashboard.counts[mode==='pass'?'passed':'failed'],1);
    assert.ok(completed.artifacts.some(a=>a.name==='BDD-ExecutionSummary.md'));
   }
   if(mode==='placeholder')assert.match(completed.error,/Api.Token/);
   if(mode==='empty')assert.match(completed.error,/No executed tests/);
   await assert.rejects(fs.access(path.join(root,created.id,'request.txt')));
  }
 }finally{
  if(previous===undefined)delete process.env.QA_DOTNET_BIN;else process.env.QA_DOTNET_BIN=previous;
  if(previousMode===undefined)delete process.env.QA_BDD_FIXTURE_MODE;else process.env.QA_BDD_FIXTURE_MODE=previousMode;
  for(const id of ids)await fs.rm(path.join(root,id),{recursive:true,force:true});await fs.rm(temporary,{recursive:true,force:true});
 }
});

test('run API exposes saved Codex response even when no artifacts were generated',async()=>{
 const fs=await import('node:fs/promises'),path=await import('node:path');const {randomUUID}=await import('node:crypto');
 const id=randomUUID(),dir=path.resolve('.qa-runs',id);
 try{
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'run.json'),JSON.stringify({id,provider:'codex',status:'finished',pattern:'3'}));
  await fs.writeFile(path.join(dir,'summary.md'),'Requirements need clarification before generation.');
  const result=await (await fetch(base+`/api/runs/${id}`)).json();
  assert.equal(result.response,'Requirements need clarification before generation.');assert.deepEqual(result.artifacts,[]);
  await fs.unlink(path.join(dir,'summary.md'));
  assert.equal((await (await fetch(base+`/api/runs/${id}`)).json()).response,'');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('automation pack downloads generated sources and excludes build output and symlinks',async()=>{
 const fs=await import('node:fs/promises');const path=await import('node:path');const {randomUUID}=await import('node:crypto');const {execFileSync}=await import('node:child_process');
 const id=randomUUID(),folder=path.resolve('.qa-runs',id),output=path.join(folder,'workspace/output');
 try{
  await fs.mkdir(path.join(output,'bddautomator/AutomationFramework/bin'),{recursive:true});
  await fs.writeFile(path.join(folder,'run.json'),JSON.stringify({id,status:'finished'}));
  await fs.writeFile(path.join(output,'bddautomator/AutomationFramework/AutomationFramework.csproj'),'<Project />');
  await fs.writeFile(path.join(output,'bddautomator/AutomationFramework/bin/old.dll'),'excluded');
  await fs.symlink(path.join(folder,'run.json'),path.join(output,'bddautomator/private.json'));
  const response=await fetch(`${base}/api/runs/${id}/automation-pack`);
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/zip');
  const zip=path.join(folder,'download.zip');await fs.writeFile(zip,Buffer.from(await response.arrayBuffer()));
  const names=JSON.parse(execFileSync(process.env.QA_PYTHON_BIN || 'python3',['-c','import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps(z.namelist()))',zip],{encoding:'utf8'}));
  assert.deepEqual(names,['bddautomator/AutomationFramework/AutomationFramework.csproj']);
  await fs.writeFile(path.join(folder,'run.json'),JSON.stringify({id,status:'running'}));
  assert.equal((await fetch(`${base}/api/runs/${id}/automation-pack`)).status,409);
 }finally{await fs.rm(folder,{recursive:true,force:true});}
});
