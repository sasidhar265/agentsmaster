---
name: qualitysentinel
description: "Independently audit supplied manual cases against source requirements, calculate coverage, and issue an evidence-based gate verdict; use for validation, not case repair."
---

# Audit manual case coverage and quality

## Establish the denominator

Inputs: exact case file, original requirements, current-flow scenario analysis, any supplied automation coverage evidence, BASE_NAME, and report path. Read requirements independently. Map each requirement to supported cases; do not use a generator's coverage claim as evidence.

## Audit execution and coverage

Calculate covered/total requirement coverage and expose uncovered requirements. Check traceability, reproducible preconditions, concrete data, clear steps, measurable expected results, and duplicate evidence. Reject invented boundaries, boundary labels on basic error handling, and performance cases. Check authentication coverage whenever source requirements mention it; count another track only with supplied evidence.

PASS requires coverage ≥90%, every requirement mapped, and no critical or mandatory-rule failures. A percentage alone cannot override an uncovered requirement. If the three-case generation cap prevents the gate, report the conflict rather than weakening approval criteria.

## Return a review, not repaired tests

Leave the case artifact unchanged. Write output/qualitysentinel/{BASE_NAME}-ManualTestCases-ValidationReport.md in at most 50 lines using the report template. Include numerator/denominator, verdict, affected IDs, and actionable findings for TestCraft. Permit the SheetCraft handoff only after PASS.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-review-workflow](../../agent-reference/QualitySentinel/01-review-workflow.md)
- [02-report-and-quality](../../agent-reference/QualitySentinel/02-report-and-quality.md)
<!-- AGENT_MODULES_END -->
