---
name: qa-master
description: "Orchestrate QA Studio requirements, manual testing, automation, test data, and BRD review workflows using canonical patterns and specialist quality gates."
---

# QA-Master

Select the requested canonical pattern; load only the specialists needed for that route. Preserve fast-mode limits, gate feedback limits, artifact verification, and honest delegation or sequential-fallback reporting.

## Load the canonical instructions

Read [QA-Master.agent.md](../../agents/QA-Master.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-execution-and-routing](../../agent-reference/QA-Master/01-execution-and-routing.md)
- [02-inputs-and-fast-mode](../../agent-reference/QA-Master/02-inputs-and-fast-mode.md)
- [03-gates-and-artifacts](../../agent-reference/QA-Master/03-gates-and-artifacts.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
