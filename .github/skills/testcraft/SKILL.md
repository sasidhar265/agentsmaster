---
name: testcraft
description: "Design executable manual test cases with concrete data and measurable expected results from supplied requirements and scenario analysis; use for manual-case authoring or targeted rework."
---

# Design executable manual cases

## Select the manual cases

Inputs: current-flow requirement and SpecForge paths, supplied test data, BASE_NAME, OUTPUT_PATH, and optional QualitySentinel findings. Read assigned material and select at most three cases according to the generation reference's mix. Keep uncovered rules visible; the cap never implies full coverage.

## Write reproducible case blocks

Use QT_001–QT_003 sequentially, independent of scenario numbering. Give every case requirement, scenario, and business-rule links; complete preconditions; numbered actions; concrete JSON data; measurable results; priority; and risk. Use only stated limits for Boundary cases. Cover Manual-Only documentation scenarios when selected; omit performance/load/latency tests. Report unknown environment details instead of inventing them.

On rework, address the named gaps in the same case file without raising the cap or producing another format. Keep the source requirements unchanged.

## Check the deliverable

Save only output/testcraft/{BASE_NAME}-ManualTestCases.md in the detailed block format. Check each case can be performed independently and its expected result observed. Return the file and remaining coverage gaps to QualitySentinel. SheetCraft owns Excel export after validation; do not append a summary table or CSV.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-generation-workflow](../../agent-reference/TestCraft/01-generation-workflow.md)
- [02-output-and-quality](../../agent-reference/TestCraft/02-output-and-quality.md)
<!-- AGENT_MODULES_END -->
