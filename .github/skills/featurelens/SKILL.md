---
name: featurelens
description: "Validate supplied Gherkin against original requirements, BDD syntax, canonical vocabulary, and automation-readiness rules; use for a feature quality gate without editing the feature."
---

# Review feature readiness

## Read source and feature independently

Inputs: feature path, original requirements and scenario analysis, BASE_NAME, and report path. Establish the required automation behaviors from source material before accepting the generated scenarios.

## Evaluate automation readiness

Inspect Gherkin structure, business alignment, scenario mix, auth coverage, canonical step wording, concrete DataTables, and observable assertions. Reject tags, Scenario Outline/Examples, placeholders, duplicates, ungrounded limits, vague steps, redundant assertions, and prohibited documentation/performance scenarios under the review reference.

Calculate readiness using the reference rubric and retain evidence for failed checks. PASS requires readiness ≥80% and every mandatory condition; do not approve syntax alone or replace missing behavior with a readiness score.

## Preserve the reviewed artifact

Write output/featurelense/{BASE_NAME}-Feature-ValidationReport.md, retaining that exact folder spelling and the prescribed report format. Return verdict, readiness, locations, and required GherkinGenie changes. Do not repair or copy the feature; BDDAutomator consumes only the validated source.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-review-workflow](../../agent-reference/FeatureLens/01-review-workflow.md)
- [02-report-and-quality](../../agent-reference/FeatureLens/02-report-and-quality.md)
<!-- AGENT_MODULES_END -->
