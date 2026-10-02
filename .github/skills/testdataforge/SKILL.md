---
name: testdataforge
description: "Generate source-grounded UK automotive finance test datasets from shared payloads, schemas, and business rules, including boundary, negative, and duplicate cases."
---

# TestDataForge

Keep supplied identifiers and finance or vehicle values authoritative. Generate missing values only under the source and schema rules; preserve dataset limits, exact filenames, and grounded expected outcomes.

## Load the canonical instructions

Read [TestDataForge.agent.md](../../agents/TestDataForge.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-source-and-generation-rules](../../agent-reference/TestDataForge/01-source-and-generation-rules.md)
- [02-limits-and-output](../../agent-reference/TestDataForge/02-limits-and-output.md)
- [03-workflow-and-quality](../../agent-reference/TestDataForge/03-workflow-and-quality.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
