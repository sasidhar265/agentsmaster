## Markdown Summary Format (short)

```markdown
# Execution Summary — {BASE_NAME}

**Verdict**: PASS | FAIL | BUILD FAILED | BLOCKED
**Report**: ./output/bddautomator/AutomationFramework/TestResults/Reports/{BASE_NAME}-AllureReport.html

| Metric | Value |
|---|---|
| Total | n |
| Passed | n |
| Failed | n |
| Skipped | n |
| Pass rate | n% |
| Duration | n.nn s |

## Failures
| Scenario | Error | Location |
|---|---|---|
| ... | ... | ... |
```

When there are no failures, the Failures table contains a single `— | No failures | —` row.

## Verdict Rules

- **PASS**: build succeeded, all tests executed, zero failed tests
- **FAIL**: one or more tests failed (report still generated — always publish the dashboard)
- **BUILD FAILED**: compilation error; no tests executed
- **BLOCKED**: SDK missing or unresolved `REPLACE_WITH_*` configuration; nothing executed

Feed `FAIL` / `BUILD FAILED` verdicts back to QA-Master with the failing scenario names and error text so BDDAutomator can rework (max 3 cycles). `BLOCKED` is escalated to the user — it needs real environment values, not a code change.

## Constraints

- **NEVER edit framework code to make a test pass** — no assertion loosening, no skipping, no `[Ignore]`, no try/catch swallowing
- **NEVER delete or overwrite the `.trx`** from a prior flow with a different `{BASE_NAME}`
- **NEVER invent execution results** — every number in the report comes from the `.trx`
- **NEVER print credentials or tokens** into logs, the HTML report or the summary
- **ALWAYS publish the HTML dashboard whenever a `.trx` exists** — including for failing runs. A `BLOCKED` run produces no `.trx`, so it produces no dashboard either; in that case publish the markdown summary alone with `**Report**: not generated — no .trx was produced`. Never synthesize a dashboard from assumed results just to have one
- **REUSE** `./scripts/TestExecution-AllureReporter.ps1`; do not inline or regenerate its logic
- **NEVER leave `.gitkeep` as the only artifact in `TestResults/Reports/`** — a placeholder file is not a report. Every executed run must publish a real, openable single-file Allure report there
- **TOKEN MINIMIZATION**: two outputs only — the Allure dashboard and the short markdown summary
