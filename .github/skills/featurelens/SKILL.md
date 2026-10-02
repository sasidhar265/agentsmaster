---
name: featurelens
description: "Review Gherkin features for syntax, business alignment, scenario coverage, canonical step vocabulary, and readiness for QA Studio automation."
---

# FeatureLens

Keep the source feature unchanged. Return evidence-based readiness and actionable findings to GherkinGenie. Preserve the prescribed output folder spelling: output/featurelense/.

## Load the canonical instructions

Read [FeatureLens.agent.md](../../agents/FeatureLens.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-review-workflow](../../agent-reference/FeatureLens/01-review-workflow.md)
- [02-report-and-quality](../../agent-reference/FeatureLens/02-report-and-quality.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
