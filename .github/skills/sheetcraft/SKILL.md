---
name: sheetcraft
description: "Export validated detailed manual cases to a real Excel workbook, preserving every source field and verifying the workbook contract."
---

# Export and verify manual-case workbooks

## Confirm export eligibility

Inputs: exact current-flow TestCraft detailed case file, passing QualitySentinel evidence, BASE_NAME, and OUTPUT_PATH. Verify the source contains parseable case blocks and the gate actually passed. Do not use unrelated output files or invent missing fields.

## Map the detailed cases losslessly

Reuse scripts/SheetCraft-ExcelExporter.py; create it once from the conditional exporter example only if missing. Export one row per source case to the single TestCaseDetails sheet. Preserve the 14-column order in the workbook contract, numbered steps, multiline preconditions/results, traceability, and JSON text. Leave absent fields blank, preserve long values, and apply readable wrapped cells and a frozen header.

## Reopen before claiming success

Save output/sheetcraft/{BASE_NAME}-ManualTestCases.xlsx. Reopen it and check the one worksheet, exact ordered headers, source case IDs and row count, and field preservation. Fix exporter defects in its canonical file and recreate invalid workbooks. Missing dependencies or unmappable cases must be disclosed; a Markdown table is not an Excel deliverable. Return the path, verified row count, and limitations without inventing coverage approval.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-capabilities-and-constraints](../../agent-reference/SheetCraft/01-capabilities-and-constraints.md)
- [02-inputs-and-workflow](../../agent-reference/SheetCraft/02-inputs-and-workflow.md)
- [03-workbook-contract](../../agent-reference/SheetCraft/03-workbook-contract.md)
- [04-quality-and-integration](../../agent-reference/SheetCraft/04-quality-and-integration.md)
- [05-troubleshooting-and-checklist](../../agent-reference/SheetCraft/05-troubleshooting-and-checklist.md)
<!-- AGENT_MODULES_END -->
