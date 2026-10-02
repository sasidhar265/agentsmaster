# SheetCraft exporter example

Read only when the canonical exporter is missing or its implementation needs repair. This is the existing example preserved verbatim, not a new output contract. The original instructions contain a seven-column/14-column mismatch (including between this example's HEADERS and parsed fields); preserve the user's chosen existing workbook layout and verify no mapped data is lost. Do not blindly replace a working exporter with this example.

```python
"""Shared, reusable SheetCraft Excel exporter. Do NOT duplicate - edit this file in place for changes."""
import argparse
import os
import re
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

# Comprehensive headers with full test case details
HEADERS = ["TCID", "Test Summary", "Priority", "Risk Level", "Category", "Component", 
           "FR", "Scenario", "BR Traceability", "Description", "Pre-conditions", 
           "Test Steps", "Test Data (JSON)", "Expected Result"]

COLUMN_WIDTHS = [12, 25, 10, 12, 18, 18, 8, 10, 15, 35, 30, 35, 40, 40]


def _extract_field(block, label):
    match = re.search(r'\*\*' + re.escape(label) + r'\*\*:\s*(.+)', block)
    return match.group(1).strip() if match else ''


def _extract_section(block, heading):
    match = re.search(r'###\s*' + re.escape(heading) + r'\s*\n(.*?)(?=\n###|\n---|\Z)', block, re.DOTALL)
    return match.group(1).strip() if match else ''


def _extract_json_block(block):
    match = re.search(r'```json\s*\n(.*?)\n```', block, re.DOTALL)
    return match.group(1).strip() if match else ''


def parse_testcraft_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    test_cases = []
    blocks = re.split(r'\n(?=## Test Case )', content)
    for block in blocks:
        if not block.strip().startswith('## Test Case'):
            continue

        test_cases.append({
            'TCID': _extract_field(block, 'TCID'),
            'Test Summary': _extract_field(block, 'Test Summary'),
            'Description': _extract_section(block, 'Description'),
            'Component': _extract_field(block, 'Component'),
            'Action': _extract_section(block, 'Test Steps'),
            'Data': _extract_json_block(block),
            'Result': _extract_section(block, 'Expected Result'),
        })

    return test_cases


def build_workbook(test_cases):
    wb = Workbook()
    wb.remove(wb.active)
    ws = wb.create_sheet("ManualTestCases")
    ws.append(HEADERS)

    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")

    for i, width in enumerate(COLUMN_WIDTHS, 1):
        ws.column_dimensions[chr(64 + i)].width = width

    for tc in test_cases:
        row = [tc.get(h, '') for h in HEADERS]
        ws.append(row)
        for cell in ws[ws.max_row]:
            cell.alignment = Alignment(wrap_text=True, vertical="top")

    return wb


def main():
    parser = argparse.ArgumentParser(description="Convert TestCraft detailed manual test case markdown to Excel")
    parser.add_argument('--input', required=True, help='Path to TestCraft {BASE_NAME}-ManualTestCases.md (detailed test case format)')
    parser.add_argument('--output', required=True, help='Path to output .xlsx file')
    args = parser.parse_args()

    if not os.path.exists(args.input):
        raise FileNotFoundError(f"Input not found: {args.input}")

    if not args.output.endswith('.xlsx'):
        raise ValueError(f"Output must be .xlsx format, got: {args.output}")

    out_dir = os.path.dirname(args.output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    test_cases = parse_testcraft_markdown(args.input)
    wb = build_workbook(test_cases)
    wb.save(args.output)

    from openpyxl import load_workbook
    load_workbook(args.output)  # raises if corrupted

    print(f"Excel file created: {args.output} ({len(test_cases)} test cases)")


if __name__ == '__main__':
    main()
```
