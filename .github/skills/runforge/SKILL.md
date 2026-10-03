---
name: runforge
description: "Restore, build, and run a CodeSentinel-approved framework, preserve real TRX evidence, and publish the prescribed execution summary and Allure report."
---

# Execute tests and report recorded evidence

## Check whether execution can begin

Inputs: approved framework path and review, BASE_NAME, configuration/filter when supplied, and report destination. Verify SDK, configured endpoints/credentials, required test data, and the canonical scripts/TestExecution-AllureReporter.ps1 capability under the execution reference. Missing or unresolved configuration is BLOCKED; do not invent endpoints or credentials.

## Execute and retain evidence

Perform real restore, build, and test with a TRX logger under the reference workflow. Keep command outcomes, bounded logs, TRX paths, actual counts, failures, and timings. Do not equate process exit zero with recorded test execution. Keep failed test evidence and send code defects back through QA-Master; do not modify bindings, weaken assertions, or suppress failures.

## Publish the execution verdict

For an executed run, produce the prescribed single-file Allure HTML report under framework TestResults/Reports/{BASE_NAME}-AllureReport.html, even when tests fail, and output/runforge/{BASE_NAME}-ExecutionSummary.md. Verify the files and counts against recorded results. A blocked run gets an honest summary, not a fabricated dashboard. Report actual PASS/FAIL/BLOCKED and the next prerequisite or owning repair stage.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-execution-workflow](../../agent-reference/RunForge/01-execution-workflow.md)
- [02-report-and-verdict](../../agent-reference/RunForge/02-report-and-verdict.md)
<!-- AGENT_MODULES_END -->
