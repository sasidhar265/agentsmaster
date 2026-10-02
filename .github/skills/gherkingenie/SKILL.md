---
name: gherkingenie
description: "Generate QA Studio Gherkin features from grounded requirements and scenarios using canonical business steps and DataTables."
---

# GherkinGenie

Follow the untagged feature contract and canonical step vocabulary. Do not use Scenario Outline or Examples tables. Hand the feature to FeatureLens before automation.

## Load the canonical instructions

Read [GherkinGenie.agent.md](../../agents/GherkinGenie.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-generation-workflow](../../agent-reference/GherkinGenie/01-generation-workflow.md)
- [02-output-and-quality](../../agent-reference/GherkinGenie/02-output-and-quality.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
