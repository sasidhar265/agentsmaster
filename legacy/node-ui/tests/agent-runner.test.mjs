import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runnerSettings,runnerCommand,codexEventText} from '../lib/agent-runner.mjs';
test('Codex runner retains sandboxing and maps the QA workflow without Copilot flags',()=>{
 const command=runnerCommand({prompt:'Execute Pattern 3',directory:'/tmp/run',mcp:{mcpServers:{}},env:{QA_RUNNER:'codex'}});
 assert.equal(command.binary,'codex');assert.ok(command.args.includes('workspace-write'));assert.ok(command.args.includes('--json'));assert.ok(!command.args.includes('--agent'));assert.match(command.args.at(-1),/Execute Pattern 3/);assert.match(command.args.at(-1),/Do not claim independent specialist review/);
 assert.equal(runnerSettings({}).provider,'codex');assert.throws(()=>runnerSettings({QA_RUNNER:'bad'}));
});
test('Codex event parsing exposes activity, progress and failures',()=>{
 assert.equal(codexEventText(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'QA_PROGRESS SpecForge started'}})),'QA_PROGRESS SpecForge started\n');
 assert.match(codexEventText(JSON.stringify({type:'turn.failed',error:{message:'quota exceeded'}})),/quota exceeded/);
 assert.equal(codexEventText(JSON.stringify({type:'thread.started'})),'');
});
