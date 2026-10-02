## Input and flow isolation

- `BASE_NAME`: Jira epic key when present; otherwise a short slug of the CURRENT BRD filename. Check for collisions before overwriting a local-BRD slug. Use the caller's explicit base name when supplied.
- Reuse the user's supplied BRD path; do not ask them to upload/paste it again. Supported requirement documents include DOCX, PDF, DOC, TXT, MD and provided content. Decode a binary document once for this flow when needed; pass its exact source path and extracted content/path, preserving citations.
- JiraExtractor saves raw attachments only to flat `./output/jira/{BASE_NAME}-{original filename}`; no epic subfolders or metadata files. Use its returned paths, not a scan of unrelated Jira output. When Jira fails, use a local BRD only if actually supplied for this request; otherwise report the blocker.
- Every invocation specifies `BASE_NAME`, exact `INPUT_PATH` file(s), exact `OUTPUT_PATH`, task, relevant gate/rework evidence and the three-item limit where applicable. Framework validators/executors may receive the explicit current framework root/project and their necessary contained files.
- Include this restriction in every handoff: "Only analyze/use the files listed under INPUT_PATH. Do not scan or reuse other flows' output, including earlier unrelated runs."
- Do not reuse pre-existing artifacts as fresh results. Same-flow, same-session rework may update the same paths; the framework's asset-preservation rules still apply. Never mix epics, BRDs or BASE_NAMEs.
- Outputs use relative `./output/` paths in the working directory. Agent folders are lowercase; never create a second folder differing only by case on Windows/macOS. No per-epic/BRD subfolders, QA-Master copy folder or redundant consolidation files.

## Shared source payload/schema

If `./input/{BASE_NAME}-PayloadSchema.json` exists, pass it to SpecForge, TestDataForge, TestCraft, GherkinGenie and BDDAutomator, alongside matching `SourcePayload.json`, requirements and any current-flow dataset. It is a permanent business-supplied input: never regenerate it or copy it as an output. Pass requirements/schema to reviewers so grounding can be checked.

- Field names/types/enums/formats and stated limits come from the schema. `x-businessRules` entries with `"boundary": true` define grounded numeric limits; never infer limits from a sample.
- `x-openList: true`: non-exhaustive; no closed enum or rejection of an unlisted value.
- `x-conflict` / `unresolved: true`: preserve supplied values and report the gap; do not choose a side.
- `x-constraintSource: "derived"`: inferred, not grounds for asserting a rejection.
- Models, Builders and Requests must conform to the schema. Builders expose `With*` methods for every schema leaf, not just fields in today's scenarios.
- Preserve supplied identifiers. TestDataForge owns generated fixtures and provenance; it must not silently overwrite the framework's `Input/TestData.json` or touch `appsettings.json`.

## Fast mode: unchanged three-item limits

Extract ALL business rules and gaps; the cap applies to generated test/scenario counts, not rule discovery.

| Agent | Limit and selection |
|---|---|
| SpecForge | 3 automation scenarios: happy path; negative/data validation; auth when in scope, else grounded boundary, else extra error handling, else edge. List Manual-Only documentation scenarios separately, outside the automation cap. |
| TestCraft | 3 manual tests, QT_001–QT_003: happy path; negative; data validation, else auth, else grounded boundary, else Manual-Only documentation, else edge. Reallocate the flexible slot in response to coverage gaps without raising the cap. |
| GherkinGenie | Exactly 3 untagged scenarios: happy path; data validation; auth when in scope, else negative/rejection, else grounded boundary, else edge. Exactly 1 DataTable scenario + 2 plain Scenario blocks. |

Never invent requirements to fill a slot. Boundaries require an explicit source limit at min/max/min-1/max+1; missing fields, malformed values, unknown IDs and invalid states are negative/edge cases. Zero boundary cases is valid if no limits exist. Auth mentioned anywhere, including scope/assumptions, requires a business rule and auth coverage. OpenAPI/Swagger/spec/documentation belongs only to manual testing. No performance/load/latency tests or infrastructure-only scenarios.

Three cases may be unable to meet the unchanged coverage gate for a large BRD. Report real coverage and uncovered requirements; do not inflate coverage, narrow its denominator, increase the cap or skip validation. Use targeted reallocation/rework (up to three cycles), then escalate unresolved gaps.

