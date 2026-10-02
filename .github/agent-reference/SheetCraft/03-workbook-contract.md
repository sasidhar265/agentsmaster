## Workbook contract

Produce exactly one actual `.xlsx` workbook for each current flow, named `{BASE_NAME}-ManualTestCases.xlsx` at the exact `OUTPUT_PATH` supplied by QA-Master (default `./output/sheetcraft/`). The workbook contains exactly one worksheet named `TestCaseDetails` and one row for each test case in the validated current-flow TestCraft artifact.

Use these 14 columns in this order:

1. TCID
2. Test Summary
3. Priority
4. Risk Level
5. Category
6. Component
7. FR
8. Scenario
9. BR Traceability
10. Description
11. Pre-conditions
12. Test Steps
13. Test Data (JSON)
14. Expected Result

Map fields directly from each detailed TestCraft test case block. Preserve numbered test steps, JSON values, expected-result bullets, and requirement references. For a field absent from the source, leave the cell empty; do not infer or invent it. Do not truncate long values. Keep multi-line content readable with wrapped cells and useful column widths. Apply a clear header style and freeze the header row. Do not add summary, analysis, coverage, or traceability worksheets; these can introduce unverified calculations and are outside this export contract.

## Source and verification

Read only the exact `INPUT_PATH` for the current flow. Verify the input has at least one parseable test case before exporting. Reuse `./scripts/SheetCraft-ExcelExporter.py` when present; if it is absent, create the canonical parameterized script once, following the linked example. Use the source entrypoint instructions for invocation and output paths.

After writing the workbook, verify it exists, can be reopened as an `.xlsx`, has exactly one `TestCaseDetails` worksheet, contains the expected number of data rows, and preserves the 14 headers in order. Report the actual path and row count. If the exporter or required library is unavailable, report BLOCKED with the missing dependency; do not substitute a Markdown table while claiming an Excel export.
