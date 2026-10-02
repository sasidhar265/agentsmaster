## Reusable Script Management (Shared Scripts Folder)

**Canonical script location**: `./scripts/SheetCraft-ExcelExporter.py` — this lives in the SAME shared `./scripts/` folder used by every other agent (e.g., `./scripts/Jira-AttachmentDownloader.ps1`). It is NOT flow-scoped; it is reusable infrastructure shared across ALL flows/epics/BRDs.

**MANDATORY BEHAVIOR (check-first, reuse, edit-in-place)**:
1. **Before writing any Excel-export code**, check whether `./scripts/SheetCraft-ExcelExporter.py` already exists.
2. **IF IT EXISTS**: Do NOT recreate or regenerate it. REUSE it as-is by invoking it with the current flow's paths:
   `python ./scripts/SheetCraft-ExcelExporter.py --input "<INPUT_PATH>" --output "<OUTPUT_PATH>"`
3. **IF IT DOES NOT EXIST**: Create it ONCE at `./scripts/SheetCraft-ExcelExporter.py` using the parameterized implementation reference linked below (accepts `--input`/`--output` as CLI arguments so it works unmodified for every future flow).
4. **IF THE LOGIC NEEDS TO CHANGE** (new column, formatting fix, bug fix): Edit the EXISTING `./scripts/SheetCraft-ExcelExporter.py` file in place. NEVER create a duplicate/versioned script (e.g., `SheetCraft-ExcelExporter-v2.py`, `SheetCraft-ExcelExporter-new.py`).
5. NEVER write one-off inline Python (e.g., `python -c "..."`) for Excel generation once the shared script exists — always call the shared script instead.
6. **NEVER DELETE THE SCRIPT AFTER USE**: `./scripts/SheetCraft-ExcelExporter.py` must persist on disk after the `.xlsx` is produced. Do NOT clean it up, move it, or treat it as a temporary artifact — leaving it in place is what makes the next flow fast.

## Output Path Configuration

**Output Location**: Use the exact `OUTPUT_PATH` provided by QA-Master for the CURRENT flow — `./output/sheetcraft/{BASE_NAME}-ManualTestCases.xlsx`, where `{BASE_NAME}` is the Jira epic key (or BRD filename slug). This is SheetCraft's OWN agent-named folder. If invoked standalone without an OUTPUT_PATH, default to `./output/sheetcraft/`.

**ONLY generate this 1 file** (TOKEN MINIMIZATION - no other files):
- `{BASE_NAME}-ManualTestCases.xlsx` - ACTUAL Excel workbook with comprehensive test case details (14 columns: TCID, Test Summary, Priority, Risk Level, Category, Component, FR, Scenario, BR Traceability, Description, Pre-conditions, Test Steps, Test Data (JSON), Expected Result)

## Input File Path

**ALWAYS read from the exact `INPUT_PATH` given by QA-Master for the CURRENT flow** — typically `./output/testcraft/{BASE_NAME}-ManualTestCases.md` (the validated manual test cases written there by TestCraft, in TestCraft's detailed test-case-block format — there is no summary table). If invoked standalone without an explicit INPUT_PATH, default to `./output/testcraft/{BASE_NAME}-ManualTestCases.md`.
- Do NOT read a test case file belonging to a different `BASE_NAME`/epic/BRD
- Parse the detailed `## Test Case QT_XXX` blocks directly and extract ALL test case metadata
- Convert to Excel with the 14-column comprehensive format below

## Approach

1. **Script Check**: Verify `./scripts/SheetCraft-ExcelExporter.py` exists (see Reusable Script Management above). Create it only if missing.
2. **Input File Identification**: Determine the current flow's `INPUT_PATH` (e.g., `{BASE_NAME}-ManualTestCases.md` from TestCraft)
3. **Invoke Shared Script**: Run `python ./scripts/SheetCraft-ExcelExporter.py --input "<INPUT_PATH>" --output "<OUTPUT_PATH>"` instead of writing inline Excel-generation code
4. **Exporter contract**:
   - Markdown Parsing: Extract each detailed test case block (not a table) by TCID
   - Comprehensive Field Mapping: TCID, Test Summary, Priority, Risk Level, Category, Component, FR, Scenario, BR Traceability, Description (from Description section), Pre-conditions (from Pre-conditions section), Test Steps (numbered list from Test Steps section), Test Data (JSON code block preserved as-is), Expected Result (bullet list from Expected Result section)
   - Excel Workbook Creation: .xlsx via openpyxl, worksheet: `TestCaseDetails` (exactly one worksheet)
   - Headers: 14 columns as listed below
   - Column widths + bold header formatting + wrapped text for multi-line cells
   - Data Population: One row per test case
5. **File Output**: Save as `{BASE_NAME}-ManualTestCases.xlsx` to `./output/sheetcraft/`
