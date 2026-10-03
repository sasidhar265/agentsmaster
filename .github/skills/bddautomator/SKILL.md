---
name: bddautomator
description: "Build or incrementally extend a C# Reqnroll/NUnit/HttpClient framework from a validated feature, preserving existing code and environment-owned assets."
---

# Build and incrementally extend the framework

## Decide the update mode before writing

Inputs: FeatureLens-approved feature and report, BASE_NAME, framework path, supplied payload/schema/data paths, and optional exact CodeSentinel findings. Stop on an invalid or unapproved feature. Inspect output/bddautomator/AutomationFramework/ to choose INITIAL BUILD or INCREMENTAL.

For each path choose SYNC for the validated feature mirror, CREATE for a missing file, EXTEND for a required new member, or LEAVE for unaffected content. A CodeSentinel finding permits a targeted PATCH to its reported lines. Preserve appsettings.json and Input/TestData.json under the asset policy; do not replace real values with placeholders or rewrite existing classes to add one binding.

## Implement the missing behavior

Map every distinct feature step to exactly one canonical Cucumber Expression binding. Follow the C# Reqnroll/NUnit/HttpClient standards, folder layout, global::Reqnroll imports, and TestContext alias placement. Keep HTTP in services, payload construction in builders, and one assertion in each Then binding. Select request shapes from the supplied schema before inferred model or DataTable shapes; write standalone Requests payloads using the request-artifact contract.

## Prove the change scope

Check step coverage, request JSON, standards, and namespaces; leave compilation approval to CodeSentinel. Compare edited paths with the planned actions and ensure unrelated code/configuration stayed intact. No changes required is a valid outcome.

Return SYNCED, CREATED, EXTENDED, and LEFT accounting, plus targeted rework patches and unresolved configuration needs. The framework is the deliverable; do not author a separate implementation guide or claim executed tests.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-generation-mode](../../agent-reference/BDDAutomator/01-generation-mode.md)
- [02-coding-standards](../../agent-reference/BDDAutomator/02-coding-standards.md)
- [03-framework-layout](../../agent-reference/BDDAutomator/03-framework-layout.md)
- [04-namespace-rules](../../agent-reference/BDDAutomator/04-namespace-rules.md)
- [05-asset-preservation](../../agent-reference/BDDAutomator/05-asset-preservation.md)
- [06-request-artifacts](../../agent-reference/BDDAutomator/06-request-artifacts.md)
- [07-implementation-workflow](../../agent-reference/BDDAutomator/07-implementation-workflow.md)
<!-- AGENT_MODULES_END -->
