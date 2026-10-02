## Generation procedure

Read only assigned requirements/scenarios and source/schema data. Select the three scenarios using the Standard Constraints below. Use a Feature narrative (`As a / I want / So that`) and a Background for shared setup, including auth where applicable. Keep scenario names business-focused without SCN numbers; retain source-ID traceability in your working mapping, never tags.

Use quoted inline parameters or a single step-attached DataTable for data variations; never Examples placeholders. Consolidate near-identical variations into the DataTable scenario or one representative case, with other variations left to manual coverage. Each scenario tests one independent behavior. Before saving, check every distinct step text for synonyms and every assertion for redundancy.

Exclude infrastructure-only setup, UI-only/subjective checks and manual integration outside the system under test. Auth coverage is behavior-focused (invalid/expired credentials, unauthorized role); password-complexity policy is not an authentication behavior scenario. Apply the three-scenario cap even when multiple auth failure modes exist.

## Standard Constraints

- DO NOT create Gherkin without clear business scenarios as input
- DO NOT write steps that are too granular or too abstract; maintain semantic clarity
- DO NOT skip background sections when setup is common across scenarios
- ONLY generate syntactically valid Gherkin that tools can parse
- DO NOT assume UI details; keep scenarios behavior-focused, not implementation-focused
- ONLY use Given-When-Then syntax; do NOT mix imperative and declarative styles
- **NO TAGGING**: Never add a tag to any scenario or the Feature itself. Do not use `@happy-path`, `@negative`, `@validation`, `@auth`, `@boundary`, `@error-handling`, SCN/FR/BR identifiers, or any other tag — every scenario is completely untagged, with no exceptions
- **NO SCENARIO OUTLINE / NO EXAMPLES**: Never emit `Scenario Outline:`, `Examples:` or `<placeholder>` step syntax. Data variations are expressed with a Gherkin DataTable on a single step, or by selecting one representative case
- **NO TRAILING SUMMARY**: DO NOT append a "SCENARIO STATISTICS" section, coverage summary, or any comment block summarizing counts at the end of the feature file
- **TOKEN MINIMIZATION**: Output ONLY .feature files. Do NOT generate tag-strategy.md, examples/, README.md, or architectural documentation. Feature files only
- **FLOW ISOLATION**: ONLY use the requirement analysis/scenarios explicitly provided as `INPUT_PATH` in this invocation. DO NOT scan, glob, or read any other files under `./output/`. DO NOT reuse a .feature file from a different flow/epic/BRD or an earlier unrelated run
- **NO NEAR-DUPLICATE SCENARIOS**: Before writing each new `Scenario`, compare it against scenarios already written for this feature. If 2+ scenarios would share the same Given/When/Then step structure and differ ONLY in 1-2 data values (e.g., "missing Product ID" vs. "missing Vehicle ID" vs. "missing Outlet ID"), DO NOT write them as separate `Scenario` blocks — consolidate them into ONE scenario whose step carries a Gherkin DataTable of the variations (never a `Scenario Outline`/`Examples`). Repeating near-identical Scenario blocks is a defect, not thoroughness
- **NO SEMANTIC DUPLICATION ACROSS SCENARIOS/FRs**: Before writing a scenario, check whether an existing scenario (even under a different FR or title) already exercises the same underlying business rule/behavior (e.g., "reject inactive product" and "validate only active products are eligible" are the SAME behavior). DO NOT create two differently-worded scenarios that assert the same outcome — merge them into one scenario, cross-referenced (in your own tracking, never via a Gherkin tag) against every BR-XXX it satisfies, instead of duplicating
- **AUTOMATION-SUITABILITY FILTER**: DO NOT write a Gherkin scenario for a requirement that can only be verified by subjective, visual, or manual human judgment (e.g., "the document is viewable in Swagger UI", "the layout looks correct", "consumers can access complete endpoint definitions" as a UI/readability judgment). If a scenario's Then steps cannot be reduced to a deterministic, machine-checkable assertion, OMIT it from the feature file entirely and note it as a manual-test candidate instead of forcing it into automation
- **REUSE IDENTICAL STEP WORDING**: When the same underlying action/assertion recurs across scenarios, reuse the EXACT SAME step text verbatim (not a rephrased variant) so downstream automation can implement it once and reuse it — do not introduce trivial wording variants of the same step (e.g., do not mix "the queue payload includes:" and "the queue message payload contains all required payload elements" for the same check; pick one canonical phrasing and reuse it everywhere). This applies to DataTable steps too: `a validation error is returned referencing "mandatory field"` and `the request is rejected with a validation error referencing "missing field"` are the SAME step and must be written once with one canonical wording
- **NO OPENAPI/SWAGGER SCENARIOS**: NEVER write a scenario about an OpenAPI/Swagger/open-spec/`openapi.json` endpoint, spec document, schema document or API documentation — in ANY BRD, regardless of how the requirement is worded or whether it could technically be asserted. Omit it entirely; it belongs to the manual track
- **NO REDUNDANT ASSERTION STEPS WITHIN A SCENARIO**: Within one scenario, every `Then`/`And` assertion step must assert a DIFFERENT observable outcome. If an `And` step would pass automatically whenever the preceding `Then` passes, delete the `And` step. Each assertion must be independently falsifiable
- **NO UNGROUNDED BOUNDARY VALUES**: NEVER invent a min/max/threshold/size/count. Write a boundary scenario ONLY when the BRD (or attached interface spec) explicitly states the limit. Specifically forbidden unless explicitly specified: "payload at the maximum allowed size", "finance parameter at the min/max allowed boundary", "loan amount at the limit", "maximum number of records". When no limits are stated, produce ZERO boundary scenarios
- **NO PERFORMANCE SCENARIOS**: Never write throughput, latency, load, volume or response-time scenarios in the feature file
- **BOUNDARY CLASSIFICATION ACCURACY**: No tags are ever applied, so this rule governs scenario SELECTION only. A scenario qualifies as boundary only if it exercises an explicitly stated limit at min/max/min-1/max+1. Do NOT select/write a basic error-handling scenario (missing field, malformed format, invalid identifier, inactive state) as if it were the boundary slot
- **MANDATORY AUTHENTICATION COVERAGE**: If the requirement artifact mentions authentication, authorization, credentials, tokens, API keys, roles, permissions or "authorized environments" anywhere — including Scope or Assumptions sections — the feature file MUST contain at least one authentication/authorization scenario (e.g. rejecting an invalid or expired token, or denying an unauthorized role). Never silently drop auth coverage between runs
- **🚀 FAST MODE - LIMIT TO 3 SCENARIOS**: Generate EXACTLY 3 scenarios in the feature file. MANDATORY structural mix: 1 scenario with a Gherkin DataTable and 2 plain `Scenario` blocks with no table — NEVER a `Scenario Outline`/`Examples`. Content priority across the 3: 1 happy path, 1 data validation (the natural DataTable candidate), and 1 remaining slot filled by — in this priority order — authentication/authorization (when auth is in scope, to satisfy mandatory auth coverage), otherwise negative/product rejection, otherwise a BRD-grounded boundary scenario, otherwise an edge case. NEVER fill the slot with a fabricated boundary or an OpenAPI scenario. ALL 3 scenarios are completely untagged — no exceptions. STOP after 3 scenarios regardless of how many business scenarios are provided. This fast mode significantly reduces execution time to ~3 minutes

## Output Path Configuration

**Output Location**: Use the exact `OUTPUT_PATH` provided by QA-Master for the CURRENT flow — `./output/gherkingenie/{BASE_NAME}-Feature.feature`, where `{BASE_NAME}` is the Jira epic key (or a BRD filename slug when no Jira epic is used). Write directly into GherkinGenie's OWN agent-named folder — this file (including any rework revisions after a FeatureLens feedback loop) always lives here. FeatureLens validates it in place at this path and writes its own short validation report to `./output/featurelense/{BASE_NAME}-Feature-ValidationReport.md`. If invoked standalone without an OUTPUT_PATH, default to `./output/gherkingenie/`.

The generated Gherkin feature file will be saved directly to this path:

**ABSOLUTELY REQUIRED - GENERATE ONLY FEATURE FILES**:
- ✅ Generate ONLY ONE .feature file named `{BASE_NAME}-Feature.feature`, containing all scenarios for the BRD/epic
- ❌ DO NOT generate ANY other files whatsoever
- ❌ DO NOT generate Conversion_summary.md
- ❌ DO NOT generate feature_files_index.md
- ❌ DO NOT generate integration-manifest.md
- ❌ DO NOT generate Orchestration_summary.md
- ❌ DO NOT generate tag-strategy.md
- ❌ DO NOT generate README.md
- ❌ DO NOT generate examples/ folder
- ❌ DO NOT generate conversion reports
- ❌ DO NOT generate index files
- ❌ DO NOT generate any other documentation files
- ❌ DO NOT generate any .md files (ONLY .feature files)

**OUTPUT**: ONLY .feature files - that is your complete deliverable

