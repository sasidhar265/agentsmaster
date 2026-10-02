## Gates and feedback

Specialists retain their complete rule sets and report templates. A threshold alone is insufficient if any mandatory rule fails.

| Gate | Required result | Failure handling |
|---|---|---|
| QualitySentinel | Coverage ≥90%, every requirement mapped, no critical gaps; executable, measurable tests, valid traceability, grounded boundaries and in-scope auth coverage | TestCraft rework, then independent re-validation |
| FeatureLens | Valid Gherkin, automation readiness ≥80%, business alignment, required scenario mix/auth coverage; no tags, Scenario Outline/Examples/placeholders, duplication, vague steps, prohibited scenarios or redundant assertions; canonical step vocabulary | GherkinGenie rework, then independent re-validation |
| BDDAutomator | All validated feature steps implemented; mandatory structure and asset preservation | Extend/fix only missing or reported parts; no changes required is a valid result |
| CodeSentinel | Zero STD-01..STD-12, structure, binding or safety violations; compilation succeeds when SDK available. SDK unavailable is explicitly SKIPPED per CodeSentinel, never represented as a successful build | BDDAutomator targeted rework, then CodeSentinel again |
| RunForge | Successful build, actual tests/TRX, single-file Allure dashboard for executed runs, execution summary; report actual failures | Code defects back to BDDAutomator, revalidate with CodeSentinel and rerun; BLOCKED prerequisites need user/environment resolution |
| SheetCraft | Real readable XLSX, correct format, every validated test exported without truncation/data loss | Escalate export failures with error details |
| DomainOutcomeValidator | Evidence-cited domain/scope, outcome, measure, testability, consistency, and readiness assessment with a justified PASS / NEEDS-IMPROVEMENT / BLOCKED verdict | Report material gaps and required clarifications; never convert missing evidence into a pass |

Allow at most 3 rework cycles per failed gate. Pass the failed rule, exact file/line or test ID, evidence/metric, cause, required fix and cycle number. Strengthen feedback on subsequent attempts. After the limit, report the persistent issue, impact and required intervention; do not proceed to dependent stages. Preserve successful parallel-track work. Never weaken assertions, skip tests, suppress failures or fabricate a pass to exit a loop.

## Automation preservation and execution

Before BDDAutomator, check whether `./output/bddautomator/AutomationFramework/` exists. If so, explicitly request INCREMENTAL mode: SYNC the validated feature; EXTEND only members required by new steps; CREATE only missing files; LEAVE unrelated files untouched. Never rewrite whole existing files. CodeSentinel rework patches reported files/lines only. Verify the `SYNCED / CREATED / EXTENDED / LEFT` close-out; reject whole-framework regeneration (including LEFT=0 on an existing framework).

`appsettings.json` and `Input/TestData.json` are environment-owned. Preserve real URLs, identifiers and user edits; never replace them with placeholders. Unknown configuration on initial creation uses `REPLACE_WITH_*`. Missing config/SDK/reporting tools are blockers, not permission to invent settings or results.

BDDAutomator and CodeSentinel own the detailed C# Reqnroll + NUnit + HttpClient standards: STD-01..STD-12, canonical Cucumber Expression bindings, 100% step coverage, mandatory layout, no step-calls-step, no secrets in code, no RestSharp/SpecFlow, and no generated/build-artifact false positives. Load their instructions only on automation routes.

RunForge performs real restore/build/test, preserves TRX evidence and publishes the single-file Allure report even when tests fail. A BLOCKED run has only its honest summary, no fabricated dashboard; `.gitkeep` is never a report. Keep credentials out of all logs/reports.

## Artifact contracts

Each specialist writes directly to its own folder. Validators never edit or copy a generator's artifact. Verify only current-flow expected outputs; missing files or a runner exit alone cannot establish success.

| Agent | Output |
|---|---|
| JiraExtractor | `./output/jira/{BASE_NAME}-{original filename}` (raw attachments only) |
| SpecForge | `./output/specforge/{BASE_NAME}-BusinessRules.md` (rules + scenario inventory + gaps/risks; no extra FR narratives) |
| TestCraft | `./output/testcraft/{BASE_NAME}-ManualTestCases.md` (detailed blocks only; no summary table/CSV) |
| QualitySentinel | `./output/qualitysentinel/{BASE_NAME}-ManualTestCases-ValidationReport.md` |
| GherkinGenie | `./output/gherkingenie/{BASE_NAME}-Feature.feature` (one feature; no tags/statistics footer) |
| FeatureLens | `./output/featurelense/{BASE_NAME}-Feature-ValidationReport.md` (retain this folder spelling) |
| BDDAutomator | `./output/bddautomator/AutomationFramework/` (layout, request JSON and config per its contract) |
| CodeSentinel | `./output/codesentinel/{BASE_NAME}-CodeValidationReport.md` |
| RunForge | `./output/runforge/{BASE_NAME}-ExecutionSummary.md`, framework `TestResults/` logs/TRX and `TestResults/Reports/{BASE_NAME}-AllureReport.html` |
| TestDataForge | `./output/testdataforge/{BASE_NAME}-TestData.json` |
| SheetCraft | `./output/sheetcraft/{BASE_NAME}-ManualTestCases.xlsx` |
| DomainOutcomeValidator | `./output/domainoutcomevalidator/{BASE_NAME}-BRD-Assessment.md` |

No extra README, Delivery_index, implementation_guide, Orchestration_summary, Conversion_summary, integration-manifest, feature_files_index, specflow.json or empty output folders (except Reports before execution). Preserve requirement → scenario → case/feature → validation traceability in the prescribed artifacts. Keep risk classifications and unresolved high-risk gaps visible; never call unvalidated outputs final.

Canonical helpers (check first; create once if allowed and missing):
- `./scripts/Jira-AttachmentDownloader.ps1`
- `./scripts/Docx-TextExtractor.ps1`
- `./scripts/SheetCraft-ExcelExporter.py`
- `./scripts/TestDataForge-Generator.py`
- `./scripts/TestExecution-AllureReporter.ps1` (supersedes the legacy TestExecution-HtmlReporter.ps1; honor runtime instructions if a missing reporter is a blocker)

## Progress and final response

Emit requested lifecycle events exactly: `QA_PROGRESS AgentName started` immediately before invoking a specialist; `QA_PROGRESS AgentName completed` only after it returns; `QA_PROGRESS AgentName blocked` on a blocker. Use `JiraExtractor` for Jira lifecycle reporting. Completion means the stage returned, not that its gate passed.

Report concisely: requested/selected pattern and sequence; agents actually executed; each gate verdict and measured coverage/readiness; rework counts; generated artifact paths; gaps/risks/blockers and necessary next steps. Distinguish PASS, FAIL, BLOCKED and SKIPPED. Do not claim complete success while required work is blocked, and do not create an extra summary file in output/.
