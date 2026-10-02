## Output Format

**Generate ONE format only** (detailed markdown, no summary table, no CSV):

### Enhanced Test Case Detailed Format (Markdown)

For each test case, generate EXACTLY this structured format:

```markdown
## Test Case [TCID]
**TCID**: [QT_001]  
**Test Summary**: [Brief title of test case]  
**Component**: [API/module/service under test, e.g. Quote Generation API]  
**Functional Requirement**: [FR-XXX]  
**Scenario**: [SCN-XXX]  
**Category**: [Positive/Happy Path | Negative | Boundary]  
**Priority**: [High | Medium | Low]  
**Risk Level**: [Critical | High | Medium | Low]  
**Business Rule Traceability**: [BR-001, BR-002 or N/A]

### Description
[1-2 sentence description of what test verifies]

### Pre-conditions
- [Precondition 1]
- [Precondition 2]
- [Precondition N]

### Test Steps
1. [Step 1 - Action with expected behavior if applicable]
2. [Step 2 - Action with expected behavior if applicable]
3. [Step N - Action with expected behavior if applicable]

### Test Data
\`\`\`json
{
  "field1": "value1",
  "field2": "value2",
  "nested": {
    "subfield": "subvalue"
  }
}
\`\`\`

### Expected Result
- [Expected result 1]
- [Expected result 2]
- [Expected result N]
```

**IMPORTANT - TCID NUMBERING CONSISTENCY**:
- TCID format: QT_NNN (where NNN is sequential: 001, 002, 003...)
- Start numbering at QT_001 for the first test case
- Increment by 1 for each subsequent test case
- Do NOT use feature file scenario numbers (e.g., avoid numbering starting at 35)
- Do NOT use different formats on different machines - QT_001 is QT_001 everywhere
- Example: QT_001, QT_002, QT_003 (NEVER: TC-35, TC-36, or other variations)

**FINAL OUTPUT FILE**:
- `{BASE_NAME}-ManualTestCases.md` - Detailed test case definitions ONLY (the format above), for all test cases. Do NOT append a markdown summary table and do NOT generate a CSV — this single detailed format is the complete deliverable, and SheetCraft parses it directly for Excel export

**Output File**: `{BASE_NAME}-ManualTestCases.md` at OUTPUT_PATH (ONE file per BRD)

## Quality Standards

- Every test case is independently executable
- Every step is verifiable and observable
- Every expected result is measurable
- Every test case links to at least one requirement
- Preconditions are complete and reproducible
- No ambiguous language or assumptions
- Every `Boundary` test case names the explicitly stated limit it exercises; no invented thresholds
- No performance/load/latency test cases
