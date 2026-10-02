---
name: specforge
description: "Analyze BRDs, specifications, and Jira requirements into grounded business rules, test scenarios, ambiguities, and risks for QA Studio."
---

# SpecForge

Preserve exact requirement values and source traceability. Hand the business-rule and scenario artifact to the requested downstream stage; leave manual case design and feature generation to their owning roles.

## Load the canonical instructions

Read [SpecForge.agent.md](../../agents/SpecForge.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-analysis-workflow](../../agent-reference/SpecForge/01-analysis-workflow.md)
- [02-output-and-quality](../../agent-reference/SpecForge/02-output-and-quality.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
