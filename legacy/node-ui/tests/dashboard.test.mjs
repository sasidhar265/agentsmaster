import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {normalizeUsage,buildDashboard} from '../lib/dashboard.mjs';
import {estimateTokenCost} from '../QaStudio.Web/wwwroot/costs.js';
const usage={totalApiDurationMs:1200,totalPremiumRequestCost:999,modelMetrics:{'model-a':{usage:{inputTokens:1000,outputTokens:200,cacheReadTokens:100,cacheWriteTokens:50,reasoningTokens:80},requests:{count:3,cost:999}}},agentMetrics:{main:{modelMetrics:{'model-a':{usage:{inputTokens:1000,outputTokens:200}}}}}};

test('usage normalization preserves unknowns and does not double count cache, reasoning or agent breakdowns',()=>{
 const normalized=normalizeUsage(usage);assert.equal(normalized.inputTokens,1000);assert.equal(normalized.totalTokens,1200);assert.equal(normalized.models[0].uncachedInputTokens,850);assert.equal(normalized.apiDurationSeconds,1.2);
 assert.equal(normalizeUsage(null).totalTokens,null);assert.equal(normalizeUsage({modelMetrics:{x:{usage:{inputTokens:10}}}}).totalTokens,null);
});

test('cost calculation uses all model token classes and explicit rates, not request multipliers',()=>{
 const models=normalizeUsage(usage).models;
 assert.equal(estimateTokenCost(models,{}),null);
 assert.equal(estimateTokenCost(models,{'model-a':{input:'2',output:'10',read:'1',write:'3'}}),0.00395);
 assert.equal(estimateTokenCost(models,{'model-a':{input:'',output:10,read:1,write:3}}),null);
 assert.equal(estimateTokenCost(models,{'model-a':{input:-1,output:10,read:1,write:3}}),null);
 assert.equal(estimateTokenCost(models,{'model-a':{input:0,output:0,read:0,write:0}}),0);
 assert.equal(estimateTokenCost([...models,{...models[0],model:'unpriced'}],{'model-a':{input:2,output:10,read:1,write:3}}),null);
});

const trx=`<?xml version="1.0"?><TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010"><Times start="2026-09-19T10:00:00Z" finish="2026-09-19T10:00:10Z"/><Results>
<UnitTestResult testId="one" testName="Happy path" outcome="Passed" duration="00:00:02.125"/>
<UnitTestResult testId="two" testName="Validation &amp; rejection" outcome="Failed" duration="00:00:03.000"><Output><ErrorInfo><Message><![CDATA[Expected 400, got 200 <script>alert(1)</script>]]></Message><StackTrace>at Validation.cs:42</StackTrace></ErrorInfo></Output></UnitTestResult>
<UnitTestResult testId="three" testName="Skipped test" outcome="NotExecuted"/>
<UnitTestResult testId="five" testName="New outcome" outcome="CustomStatus"/>
</Results><TestDefinitions><UnitTest id="one" name="Happy path"><TestMethod className="Quotes"/></UnitTest><UnitTest id="two" name="Validation"/><UnitTest id="three" name="Skipped test"/><UnitTest id="four" name="Never executed"/><UnitTest id="five" name="New outcome"/></TestDefinitions><ResultSummary><Counters total="5" passed="1" failed="1"/></ResultSummary></TestRun>`;
async function fixture(action){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qa-dashboard-'));try{await fs.mkdir(path.join(directory,'workspace/output'),{recursive:true});await action(directory);}finally{await fs.rm(directory,{recursive:true,force:true});}}
const run={id:'fixture',status:'finished',createdAt:'2026-09-19T10:00:00Z',finishedAt:'2026-09-19T10:00:30Z',prompt:'Dashboard tests'};
test('TRX dashboard preserves failures and unexecuted tests with distinct elapsed and execution timing',async()=>fixture(async directory=>{
 await fs.writeFile(path.join(directory,'workspace/output/results.trx'),trx);await fs.writeFile(path.join(directory,'usage.json'),JSON.stringify(usage));
 const result=await buildDashboard(run,directory,[{path:'results.trx',name:'results.trx'}]);
 assert.deepEqual(result.counts,{total:5,passed:1,failed:1,not_run:2,running:0,unknown:1});assert.equal(result.passRate,50);assert.equal(result.completionRate,40);assert.equal(result.wallSeconds,30);assert.equal(result.executionSeconds,10);assert.equal(result.testSeconds,5.125);
 assert.match(result.tests.find(t=>t.status==='failed').failure,/Expected 400, got 200/);assert.equal(result.tests.find(t=>t.status==='failed').stackTrace,'at Validation.cs:42');assert.equal(result.usage.totalTokens,1200);
 await assert.rejects(buildDashboard(run,directory,[{path:'results.trx',name:'results.trx'}],'../../outside.trx'),/not found/);
}));
test('multiple reports default to latest and support explicit attempt selection without summing reruns',async()=>fixture(async directory=>{
 const report=path.join(directory,'workspace/output');await fs.writeFile(path.join(report,'old.trx'),trx);await fs.utimes(path.join(report,'old.trx'),new Date(0),new Date(0));
 await fs.writeFile(path.join(report,'new.trx'),trx.replace('outcome="Failed"','outcome="Passed"'));
 const artifacts=['old.trx','new.trx'].map(name=>({path:name,name}));
 const latest=await buildDashboard(run,directory,artifacts);assert.equal(latest.selectedReport,'new.trx');assert.equal(latest.counts.total,5);assert.equal(latest.counts.failed,0);
 const old=await buildDashboard(run,directory,artifacts,'old.trx');assert.equal(old.counts.failed,1);
}));
test('no TRX means discovered scenarios have no recorded execution; malformed XML does not fabricate results',async()=>fixture(async directory=>{
 const output=path.join(directory,'workspace/output');await fs.mkdir(path.join(output,'gherkingenie'));
 await fs.writeFile(path.join(output,'gherkingenie/example.feature'),'Feature: Quotes\n Scenario: Happy path\n Given a quote\n Scenario: Invalid input\n');
 const inventory=await buildDashboard(run,directory,[]);assert.equal(inventory.counts.not_run,2);assert.equal(inventory.passRate,null);assert.equal(inventory.executionSeconds,null);assert.equal(inventory.usage.available,false);
 await fs.writeFile(path.join(output,'bad.trx'),'<TestRun><Results>');const broken=await buildDashboard(run,directory,[{path:'bad.trx',name:'bad.trx'}]);assert.equal(broken.counts.total,0);assert.ok(broken.warnings.length);
 await fs.writeFile(path.join(output,'bad.trx'),'<!DOCTYPE x [<!ENTITY y "bad">]><TestRun/>');const unsafe=await buildDashboard(run,directory,[{path:'bad.trx',name:'bad.trx'}]);assert.match(unsafe.warnings[0],/declarations/);
}));
