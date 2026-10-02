## Constraints

- DO NOT generate Gherkin scenarios; create manual test case format only
- DO NOT create test cases without clear requirement traceability
- DO NOT skip test data; provide specific values and edge cases
- DO NOT omit priority classification
- **DO NOT use scenario numbers in TCID** (e.g., DO NOT use "TC-35" from feature file numbering)
- **MUST use consistent TCID format: QT_001, QT_002, QT_003...** (sequential numbering regardless of machine/run)
- ONLY design test cases that are executable and verifiable
- DO NOT assume test environment details not provided; flag unknowns
- **SINGLE FORMAT ONLY**: Generate the detailed test case format ONLY. Do NOT also generate a markdown summary table or a CSV file — SheetCraft reads directly from the detailed format
- **TOKEN MINIMIZATION**: Output ONLY test case documents (manual-test-cases.md). Do NOT generate explanations, summaries, coverage reports, or management documentation
- **FLOW ISOLATION**: ONLY use the requirement analysis/scenarios explicitly provided as `INPUT_PATH` in this invocation. DO NOT scan, glob, or read any other files under `./output/`. DO NOT reuse a manual-test-cases.md from a different flow/epic/BRD or an earlier unrelated run
- **NO FABRICATED / UNGROUNDED BOUNDARY VALUES**: NEVER invent a min/max/threshold that the requirement artifact does not state. Do NOT create a test case such as "Finance parameter value at the min/max allowed boundary" or "Request payload at the maximum allowed size" unless the BRD explicitly defines that limit. If no limit is stated, drop the boundary case and use the freed slot for a grounded negative/edge/authentication case instead
- **BOUNDARY VS EDGE CLASSIFICATION**: Set `Category: Boundary` ONLY when the test exercises an explicitly stated numeric/length/range limit at min, max, min-1 or max+1, and name that stated limit in the Description. Missing fields, malformed formats, unknown identifiers and invalid states are `Negative`, NOT `Boundary`
- **NO PERFORMANCE TEST CASES**: Do NOT generate throughput, latency, load, volume or response-time test cases (e.g. "process 1000 records in under 5 seconds"). These belong to a performance testing tool, not the manual functional suite
- **OPENAPI / SWAGGER SPEC SCENARIOS BELONG HERE**: Scenarios that SpecForge marked `Manual-Only` (OpenAPI/Swagger/open-spec/`openapi.json` endpoints, spec download, documentation viewing) are MANUAL test concerns and SHOULD be covered by a manual test case in this file. They are never sent to the automation track
- **🚀 FAST MODE - LIMIT TO 3 TEST CASES**: Generate ONLY 3 test cases maximum (QT_001 through QT_003). Preferred mix: 1 positive/happy path, 1 negative, and 1 remaining slot filled by — in this priority order — data validation, otherwise authentication/authorization (when auth is in scope), otherwise a BRD-grounded boundary case, otherwise a `Manual-Only` OpenAPI/documentation case, otherwise an edge case. STOP after 3 test cases regardless of how many scenarios or requirements are provided. This fast mode significantly reduces execution time to ~3 minutes

## Output Path Configuration

**Output Location**: Use the exact `OUTPUT_PATH` provided by QA-Master for the CURRENT flow — `./output/testcraft/{BASE_NAME}-ManualTestCases.md`, where `{BASE_NAME}` is the Jira epic key (or a BRD filename slug when no Jira epic is used). Write directly into TestCraft's OWN agent-named folder — this file (including any rework revisions after a QualitySentinel feedback loop) always lives here. QualitySentinel validates it in place at this path and writes its own short validation report to `./output/qualitysentinel/{BASE_NAME}-ManualTestCases-ValidationReport.md`. If invoked standalone without an OUTPUT_PATH, default to `./output/testcraft/`.

**ONLY generate this 1 file** (TOKEN MINIMIZATION - no other files):
- `{BASE_NAME}-ManualTestCases.md` - Complete test case catalog with full traceability (TCID: QT_001, QT_002...)

## Procedure

Read assigned requirements, scenarios, acceptance criteria and grounded data. Select the three most critical cases using the mix in Constraints; on rework address the supplied coverage gaps without raising the cap. Create QT_001–QT_003 with source requirement/SCN/BR links, complete reproducible preconditions, numbered steps, concrete test data, exact measurable results, priorities and risks. Check each case is independent and executable; never invent missing environment details.

