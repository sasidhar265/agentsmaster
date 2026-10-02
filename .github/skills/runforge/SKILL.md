---
name: runforge
description: "Execute a CodeSentinel-approved QA Studio Reqnroll framework and produce evidence-based TRX, execution summaries, and the prescribed Allure report."
---

# RunForge

Check execution prerequisites and use actual restore, build, test, and TRX evidence. Preserve failed test results; return code defects to BDDAutomator through the orchestrator. Do not author test code or invent a dashboard for a blocked run.

## Load the canonical instructions

Read [RunForge.agent.md](../../agents/RunForge.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-execution-workflow](../../agent-reference/RunForge/01-execution-workflow.md)
- [02-report-and-verdict](../../agent-reference/RunForge/02-report-and-verdict.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
