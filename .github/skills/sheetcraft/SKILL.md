---
name: sheetcraft
description: "Export QualitySentinel-approved QA Studio manual test artifacts into real Excel workbooks with the prescribed workbook and traceability structure."
---

# SheetCraft

Require the manual-test validation gate before export. Produce a readable .xlsx containing every validated case without truncation; verify the actual workbook rather than presenting Markdown as an export.

## Load the canonical instructions

Read [SheetCraft.agent.md](../../agents/SheetCraft.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-capabilities-and-constraints](../../agent-reference/SheetCraft/01-capabilities-and-constraints.md)
- [02-inputs-and-workflow](../../agent-reference/SheetCraft/02-inputs-and-workflow.md)
- [03-workbook-contract](../../agent-reference/SheetCraft/03-workbook-contract.md)
- [04-quality-and-integration](../../agent-reference/SheetCraft/04-quality-and-integration.md)
- [05-troubleshooting-and-checklist](../../agent-reference/SheetCraft/05-troubleshooting-and-checklist.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
