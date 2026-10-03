---
name: automationforge
description: "Route a request naming the retired AutomationForge agent to its maintained generation, code-review, or execution replacement."
---

# Route retired AutomationForge requests

## Resolve the former responsibility

AutomationForge remains retired. Determine whether the request concerns framework creation/update, standards review, execution, or a combined route:

| Requested work | Maintained skill |
| --- | --- |
| Framework, services, builders, models, utilities, hooks, or bindings | [BDDAutomator](../bddautomator/SKILL.md) |
| Standards and compilation review | [CodeSentinel](../codesentinel/SKILL.md) |
| Test execution and reporting | [RunForge](../runforge/SKILL.md) |
| Multiple stages or unclear workflow | [QA-Master](../qa-master/SKILL.md) |

Load only the replacement needed for the requested work and pass the existing inputs and scope. Do not invoke the legacy agent, generate retired artifacts, or revive RestSharp guidance. Return the selected route and any missing prerequisite; no standalone implementation is owned by this skill.
