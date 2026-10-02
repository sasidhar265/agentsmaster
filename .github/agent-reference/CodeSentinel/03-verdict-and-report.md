## Verdict Rules

- **PASS**: zero CRITICAL and zero MAJOR violations, and compilation succeeded or was skipped
- **FAIL**: any standards violation (A), structure violation (B), coverage violation (C), safety violation (D), or compilation error (E)
- Severity: **CRITICAL** = standards A, safety D, compilation E · **MAJOR** = structure B, coverage C · **MINOR** = naming/style nits, build warnings

---

## Report Format (write exactly this, keep it short)

```markdown
# Code Validation Report — {BASE_NAME}

**Verdict**: PASS | FAIL
**Validated**: ./output/bddautomator/AutomationFramework/
**Compilation**: SUCCESS | FAILED | SKIPPED (SDK not available)

## Summary
| Check | Result |
|---|---|
| Coding standards (STD-01..STD-12) | x/12 passed |
| Folder structure & naming | PASS/FAIL |
| Step binding coverage | PASS/FAIL (n steps, n bindings) |
| Safety & configuration | PASS/FAIL |

## Violations
| # | Severity | Rule | File | Line | Evidence | Required fix |
|---|---|---|---|---|---|---|
| 1 | CRITICAL | STD-02 | Reqnroll/StepDefinitions/QuoteGenerationStepDefinition.cs | 42 | `var payload = JsonSerializer.Serialize(...)` in step body | Move serialization into `QuoteService`; step body must be a single service call |

## Passed Checks
- STD-01 No conditionals
- STD-06 HttpClient only
...
```

If the verdict is PASS, the Violations table contains a single row: `— | — | — | — | — | No violations found | —`.

## Constraints

- **NEVER edit, rewrite or "fix" generated framework files** — report only
- **NEVER write a copy of the validated code** into `./output/codesentinel/`
- **ONE output file only** — no supplementary metrics, guides or summaries
- **Cite exact file paths and line numbers** for every violation; a violation without evidence is invalid
- **No false positives**: quote the offending source text in the Evidence column
- **TOKEN MINIMIZATION**: the report is a short table-driven document, not a narrative
