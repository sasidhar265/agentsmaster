---
name: specforge
description: "Extract traceable business rules, grounded scenarios, ambiguities, and risks from supplied requirements; use before manual case or Gherkin generation."
---

# Extract business rules and grounded scenarios

## Establish the evidence set

Inputs: exact current-flow requirement paths or inline content, BASE_NAME, and OUTPUT_PATH. Read the complete assigned documents; do not discover other runs under output/. Inventory business rules, explicitly stated limits, authentication scope, and documentation-only requirements before selecting scenarios.

## Derive rules and scenarios

Assign stable BR and SCN identifiers with source requirement links. Record missing limits and contradictory statements as gaps rather than inventing values. A Boundary scenario needs the exact stated limit; malformed data or missing fields are Negative/Data Validation/Edge.

Select at most three Automation scenarios: happy path, negative, then authentication when in scope; otherwise a stated boundary, additional error, or edge case. Mark OpenAPI/Swagger documentation scenarios Manual-Only and keep them outside that automation cap. Extract all business rules even when the scenario cap prevents complete testing.

## Verify and hand off

Write only output/specforge/{BASE_NAME}-BusinessRules.md using the business-rule and scenario tables in the output reference. Check unique IDs, source links, scenario tracks, cited boundaries, and explicit LOW/MEDIUM/HIGH/CRITICAL risks. Return the path and unresolved gaps; test-case design belongs to TestCraft.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-analysis-workflow](../../agent-reference/SpecForge/01-analysis-workflow.md)
- [02-output-and-quality](../../agent-reference/SpecForge/02-output-and-quality.md)
<!-- AGENT_MODULES_END -->
