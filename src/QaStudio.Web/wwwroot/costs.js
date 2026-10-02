// Cost estimates use user-supplied rates, never Copilot request multipliers.
export function estimateTokenCost(models,rates) {
  if(!models.length)return null;
  let total=0;
  for(const model of models){
    for(const [tokens,key] of [[model.uncachedInputTokens,'input'],[model.outputTokens,'output'],[model.cacheReadTokens,'read'],[model.cacheWriteTokens,'write']]){
      if(typeof tokens!=='number' || !Number.isFinite(tokens) || tokens<0)return null;
      if(tokens===0)continue;
      const value=rates[model.model]?.[key];
      if(value===undefined || value===null || String(value).trim()==='' || !Number.isFinite(Number(value)) || Number(value)<0)return null;
      total+=tokens*Number(value)/1e6;
    }
  }
  return total;
}
