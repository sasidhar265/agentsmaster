const catalog = {
 'QA-Master':['Coordinates the workflow and quality gates',['Select the requested pattern','Delegate specialist work','Review outputs and blockers']],
 JiraExtractor:['Collects Jira requirements and attachments',['Read the issue','Extract supporting requirements']],
 SpecForge:['Analyzes requirements and business rules',['Identify business rules','Map scenarios and requirement gaps']],
 TestCraft:['Creates manual test cases',['Write preconditions, steps and expected results','Cover priority positive and negative cases']],
 QualitySentinel:['Reviews manual test quality',['Check requirement coverage','Report corrections and validation verdict']],
 SheetCraft:['Exports validated manual tests',['Format validated test cases','Publish the Excel deliverable']],
 GherkinGenie:['Creates BDD scenarios',['Translate requirements into Gherkin','Publish feature files']],
 FeatureLens:['Reviews BDD scenarios',['Validate Gherkin and requirement coverage','Report automation readiness']],
 BDDAutomator:['Builds the automation framework',['Generate Reqnroll bindings and supporting code','Configure the test project']],
 CodeSentinel:['Reviews generated automation',['Validate bindings and project structure','Check build readiness']],
 RunForge:['Executes automation and publishes evidence',['Run configured tests','Publish results and execution reports']],
 TestDataForge:['Generates grounded test datasets',['Read source payload and schema','Generate and validate test data']]
};
export function failureDetails(run,log='') {
 const provider=run.provider==='codex'?'Codex':'Copilot';
 const clean=log.replace(/\x1b\[[0-9;]*m/g,'');
 if(run.status!=='running' && /exceeded your monthly quota|quota.{0,30}exceeded|insufficient.{0,10}credits|hit your usage limit/i.test(clean))return {reason:`${provider} quota exceeded`,detail:`${provider} reported that this account has exceeded its available quota.`,action:`Restore available ${provider} quota or sign in with an account that has capacity, then start a new run.`};
 if(!['failed','blocked','timed_out','interrupted','cancelled'].includes(run.status))return null;
 if(/not authenticated|authentication failed|please.{0,10}(log|sign) in/i.test(clean))return {reason:`${provider} authentication required`,detail:'The runner could not authenticate.',action:`Run ${provider.toLowerCase()} login in your terminal, then start a new run.`};
 const evidence=clean.split('\n').find(line=>/failed to load|^error[: ]|^fatal[: ]/i.test(line.trim()));
 return {reason:run.status==='timed_out'?'Generation timed out':run.status==='cancelled'?'Run cancelled':run.status==='interrupted'?'Run interrupted':'Generation could not finish',detail:evidence || run.error || `The run ${run.status}.`,action:'Review the runner activity below for details before starting a new run.'};
}
export function runProgress(run,log,agents) {
 const states=new Map();
 // Explicit runner markers only: incidental mentions of an agent are not execution evidence.
 for(const match of log.matchAll(/^\s*QA_PROGRESS\s+(\S+)\s+(started|completed|blocked)\s*$/gm))states.set(match[1],match[2]);
 return ['QA-Master',...(run.jira?['JiraExtractor']:[]),...agents].map(name=>{
 const reported=states.get(name);const running=run.status==='running';
 const status=reported==='completed'?'completed':reported==='blocked'?'blocked':reported==='started'?(running?'running':'stopped'):name==='QA-Master'&&running?'running':running?'pending':'unconfirmed';
 const [description,tasks]=catalog[name] || ['Workflow specialist',[]];
 return {name,description,tasks,status};
 });
}
