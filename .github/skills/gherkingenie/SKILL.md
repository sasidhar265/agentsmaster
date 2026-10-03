---
name: gherkingenie
description: "Translate grounded requirements and automation scenarios into one untagged Gherkin feature with canonical business steps; use for feature authoring or FeatureLens rework."
---

# Author canonical Gherkin features

## Choose automation behavior

Inputs: exact current-flow requirements and scenario analysis, grounded dataset when provided, BASE_NAME, OUTPUT_PATH, and optional FeatureLens feedback. Exclude Manual-Only/OpenAPI documentation scenarios. Preserve the maximum three automation scenarios and source-backed mix from the generation reference.

## Express the scenarios

Use business-focused Given/When/Then steps and the canonical vocabulary defined in the generation reference. Reuse step wording for the same behavior; vary data through literal values or step-attached DataTables. Use plain Scenario blocks, without tags, Scenario Outline, Examples, or unresolved placeholders. Expected outcomes come from requirements; a missing rule remains a gap.

## Check the feature boundary

Write only output/gherkingenie/{BASE_NAME}-Feature.feature. Inspect syntax, scenario count, duplicated behavior, grounded assertions, prohibited documentation/performance concerns, and step consistency. Submit the feature to FeatureLens; do not create bindings or treat self-checks as independent validation.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-generation-workflow](../../agent-reference/GherkinGenie/01-generation-workflow.md)
- [02-output-and-quality](../../agent-reference/GherkinGenie/02-output-and-quality.md)
<!-- AGENT_MODULES_END -->
