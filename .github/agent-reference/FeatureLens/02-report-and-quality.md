## Output Format

**Generate ONE short validation report file** (concise summary only, no detailed breakdowns):

**Output File**: `./output/featurelense/{BASE_NAME}-Feature-ValidationReport.md`

```
# FeatureLens Validation Report - [Feature Name]

**Input**: `{BASE_NAME}-Feature.feature` (from ./output/gherkingenie/) | **Date**: [date]

## Quality Gate Result: [✅ PASS | ❌ FAIL]

| Metric | Score | Status |
|--------|-------|--------|
| Syntax Correctness | [X]% | [PASS/FAIL] |
| Automation Readiness | [X]% | [PASS/FAIL] (≥80% threshold) |
| Business Alignment | [X]% | [PASS/FAIL] |
| Duplication-Free | [X]% | [PASS/FAIL] (no near-duplicate or semantically duplicate scenarios) |
| Canonical Step Vocabulary | [X]% | [PASS/FAIL] (one phrasing per action) |
| Prohibited Scenarios | [N] | [NONE / OpenAPI, performance, ungrounded boundary counts] |
| Tags Present | [N] | [PASS if 0 / FAIL — file must be completely untagged] |
| Redundant Assertion Steps | [N] | [NONE / list count] |
| Authentication Coverage | [Present/Absent] | [PASS/FAIL] (required when auth in scope) |
| Critical Issues | [N] | [NONE / list count] |

## Summary
- [Scenario count] scenarios validated across [requirement/FR count]
- [Key issues found, and whether fixed or still outstanding]
- [1-2 lines of any residual, non-blocking recommendations]

## Outcome
[Approved and passed downstream / Returned to GherkinGenie for rework, with reason]
```

**Constraints**:
- Output EXACTLY the template above, filled in — nothing more
- No detailed Gherkin syntax tables, business alignment matrix, scenario-by-scenario breakdown, per-criterion scoring sections, or strengths/observations lists
- Maximum 25 lines total
- Validation results ONLY, no explanations, no elaboration beyond the Summary bullets shown

## Quality Standards

- All Gherkin syntax must be valid and parseable (FAIL if any errors)
- All steps must be automation-ready (FAIL if vague or hard-coded)
- All scenarios must map to business requirements (FAIL if unmapped)
- Coverage must include positive, negative, and — only where the artifact states a limit — boundary scenarios
- The file must be COMPLETELY UNTAGGED (FAIL if ANY tag is present — GherkinGenie is forbidden from tagging, so a tag is a defect, never a requirement)
- No scenario-specific implementations; use semantic language (FAIL if UI-specific)
- No 2+ scenarios may be near-duplicates differing only in a data value (FAIL — consolidate with a DataTable instead)
- No `Scenario Outline` / `Examples` / `<placeholder>` syntax anywhere (FAIL — banned by the automation standard)
- No 2+ scenarios may validate the same business rule/behavior under different names or FRs (FAIL — redundant)
- No scenario may depend on subjective/manual/visual verification to pass (FAIL — belongs in the manual test suite, not automation)
- No scenario may concern an OpenAPI/Swagger/spec/API-documentation endpoint (FAIL — always manual)
- No two assertion steps within a scenario may assert the same observable outcome (FAIL — delete the redundant step)
- No two step texts may describe the same action/assertion (FAIL — one canonical phrasing, reused verbatim)
- No boundary scenario may use a limit not explicitly stated in the requirement artifact (FAIL — remove it)
- No `@boundary` tag may be applied to a basic error-handling scenario (FAIL — reclassify)
- No performance/latency/load/payload-size scenarios (FAIL — wrong tool)
- At least one authentication/authorization scenario must exist when auth is in scope (FAIL — coverage gap)
