import path from 'node:path';
export function runnerSettings(env=process.env){
 const provider=env.QA_RUNNER || 'codex';
 if(!['copilot','codex'].includes(provider))throw new Error('QA_RUNNER must be copilot or codex.');
 return {provider,label:provider==='codex'?'Codex CLI':'Copilot CLI',binary:provider==='codex'?(env.QA_CODEX_BIN || 'codex'):(env.QA_COPILOT_BIN || 'copilot')};
}
export function runnerCommand({prompt,directory,mcp,env=process.env}){
 const settings=runnerSettings(env);
 if(settings.provider==='codex')return {...settings,args:['exec','--skip-git-repo-check','--sandbox','workspace-write','--json','--color','never','--output-last-message',path.join(directory,'summary.md'),prompt+'\nRuntime: Codex CLI. Read the QA-Master and specialist markdown files as workflow instructions. Copilot-specific tools may be unavailable: use available Codex tools and report missing capabilities explicitly. You may delegate specialist work when supported; otherwise execute the specialist stages sequentially, clearly reporting this fallback. Keep all generated work in this run workspace. Do not claim independent specialist review when stages were performed by the same agent. Do not change existing source inputs.']};
 const args=['--agent','QA-Master','-p',prompt,'--allow-all-tools','--no-color','--stream','on','--usage-output-file',path.join(directory,'usage.json')];
 if(Object.keys(mcp.mcpServers).length)args.push('--additional-mcp-config',JSON.stringify(mcp));
 return {...settings,args};
}
export function codexEventText(line){
 let event;try{event=JSON.parse(line);}catch{return line+'\n';}
 const item=event.item;
 if(event.type==='item.completed' && item?.type==='agent_message')return item.text+'\n';
 if(item?.type==='command_execution' && event.type==='item.started')return `Executing: ${item.command}\n`;
 if(item?.type==='command_execution' && event.type==='item.completed')return (item.aggregated_output || '')+'\n';
 if(event.type==='error' || event.type==='turn.failed')return `Error: ${event.message || event.error?.message || 'Codex execution failed'}\n`;
 if(event.type==='turn.completed')return 'Codex turn completed. Review artifacts and validation reports.\n';
 return '';
}
