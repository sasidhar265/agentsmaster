## Troubleshooting

- **Input missing or no parseable cases:** confirm the exact current-flow `INPUT_PATH` with QA-Master. Stop and report BLOCKED; do not search other runs or invent rows.
- **Canonical exporter missing:** create `./scripts/SheetCraft-ExcelExporter.py` once from `sheetcraft-exporter-example.md`, using the input/output contract. If a required library is unavailable, report the dependency and stop.
- **Workbook is invalid or incomplete:** repair the canonical exporter in place, then recreate and reopen the workbook. Do not leave a partial workbook described as complete.
- **Source field absent or malformed:** preserve the available source content, leave genuinely absent columns blank, and disclose data that could not be mapped. Never silently drop a test case or rewrite its expected result.

## Completion checklist

- Used only the current flow's supplied input path.
- Exported every source test case once with no invented content.
- Workbook opens as `.xlsx`, contains exactly one `TestCaseDetails` worksheet, and has the 14 headers in the order defined by `03-workbook-contract.md`.
- Data row count matches the source test case count; long text and JSON are preserved without truncation.
- Reported the actual output path, row count, and verification result.

If any check fails, fix the workbook or report the blocker. Do not claim success based on intended output or a file extension alone.
