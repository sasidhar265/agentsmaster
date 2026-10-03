---
name: testdataforge
description: "Create deterministic, source-preserving automotive finance fixtures with provenance and grounded boundary/negative cases from a supplied payload and schema."
---

# Generate source-grounded finance fixtures

## Resolve the source contract

Inputs: exact current-flow source payload, matching optional schema, requirement analysis, BASE_NAME, OUTPUT_PATH, and seed. Parse supported JSON/JSONC without changing the source. The supplied schema controls types, enums, formats, and limits; x-openList values are not closed enums and derived constraints are not stated requirements.

Preserve all supplied identifiers and values. Generate missing identifiers only under the generation rules. Record conflicts such as CapCode/productId formats without selecting an interpretation. A fixture intentionally testing an invalid value is separate from the untouched baseline and must name the condition it violates.

## Generate repeatable fixtures

Reuse scripts/TestDataForge-Generator.py; create the canonical parameterized helper only when missing. Emit the required valid baseline, supported boundary pairs, negative and duplicate cases under the source rules. Derive percentages from the fixture's actual priceTotal. Use stable keys, seed, provenance, and explicit generation-date context when a rule depends on today; disclose any date-dependent reproducibility limit rather than silently changing results.

## Validate and deliver

Write only output/testdataforge/{BASE_NAME}-TestData.json with _meta provenance and grounded limits. Check loadable JSON, complete fixtures, byte-preserved supplied identifiers, generated identifier rules, and supported expected validity. Report unresolved conflicts and omitted unsupported cases. Do not overwrite framework Input/TestData.json without explicit instruction or alter appsettings.json.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-source-and-generation-rules](../../agent-reference/TestDataForge/01-source-and-generation-rules.md)
- [02-limits-and-output](../../agent-reference/TestDataForge/02-limits-and-output.md)
- [03-workflow-and-quality](../../agent-reference/TestDataForge/03-workflow-and-quality.md)
<!-- AGENT_MODULES_END -->
