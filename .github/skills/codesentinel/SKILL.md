---
name: codesentinel
description: "Audit C# Reqnroll framework standards, folder structure, binding coverage, and compilation evidence; use for code approval or review after targeted rework."
---

# Audit framework standards and compilation

## Establish the review scope

Inputs: exact framework root, validated feature, source/request contracts, BASE_NAME, report path, and optional prior findings. Inventory authored source and required assets; exclude generated feature code, bin, obj, and other generated artifacts from source-rule violations.

## Review against the actual standards

Apply STD-01..STD-12 and the additional structure, namespace, binding, safety, and asset-preservation checks in the validation reference. Verify one canonical binding for each distinct feature step, no orphan bindings, correct Then assertions, service/builder separation, shared HttpClient, no prohibited branching/serialization attributes/SpecFlow/RestSharp, and configuration-driven endpoints without exposed secrets.

Build when the SDK is available and record its actual command and outcome. An unavailable SDK is SKIPPED under the report rules, never a successful compilation; code violations remain failures. Rework review checks both the named fixes and any effects they introduce.

## Issue actionable findings

Write output/codesentinel/{BASE_NAME}-CodeValidationReport.md using the verdict reference. Report rule ID, exact path/line, evidence, and required correction. Never edit framework code. Return the verdict and compilation status to QA-Master; BDDAutomator owns repairs and RunForge owns execution.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-scope](../../agent-reference/CodeSentinel/01-scope.md)
- [02-validation-rules](../../agent-reference/CodeSentinel/02-validation-rules.md)
- [03-verdict-and-report](../../agent-reference/CodeSentinel/03-verdict-and-report.md)
<!-- AGENT_MODULES_END -->
