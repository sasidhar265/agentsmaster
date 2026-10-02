## Output Format

**Generate ONE short validation report file** (concise summary only, no detailed breakdowns):

**Output File**: `./output/qualitysentinel/{BASE_NAME}-ManualTestCases-ValidationReport.md`

```
# QualitySentinel Validation Report - [Test Suite Name]

**Input**: `{BASE_NAME}-ManualTestCases.md` (from ./output/testcraft/) | **Date**: [date]

## Quality Gate Result: [✅ PASS | ❌ FAIL]

| Metric | Score | Status |
|--------|-------|--------|
| Requirement Coverage | [X]% | [PASS/FAIL] (≥90% threshold) |
| Duplicate-Free | [X]% | [PASS/FAIL] |
| Scenario Clarity | [X]% | [PASS/FAIL] |
| Critical Issues | [N] | [NONE / list count] |

## Coverage Validation
- Requirements Covered: [M]/[N]
- Duplicate/Overlapping Test Cases: [count + brief list if any]
- Missing Coverage: [list gaps, e.g. negative/boundary/security]

## Outcome
[Approved and passed downstream / Returned to TestCraft for rework, with reason]
```

**Constraints**:
- No detailed coverage tables, full issue register, or requirement-by-requirement breakdown
- Maximum 50 lines total
- Validation results ONLY, no explanations

## Quality Standards

- Coverage threshold: ≥90% (FAIL below this level)
- Every requirement must have ≥1 test case (FAIL if any uncovered)
- Test steps must be clear and unambiguous (FAIL if vague)
- Expected results must be measurable and specific (FAIL if subjective)
- No duplicate test cases (FLAG and recommend consolidation)
- All traceability IDs must be present (FAIL if missing)
- Every `Boundary` test case cites an explicitly stated limit (FAIL if invented)
- No boundary label on basic error-handling cases (FAIL — reclassify as Negative)
- Authentication/authorization covered whenever it is in scope (FAIL if uncovered by both tracks)
- No performance/load/latency test cases (FAIL — wrong tool)
