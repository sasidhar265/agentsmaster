## Constraints

- DO NOT generate test cases; only scenarios and requirement analysis
- DO NOT make assumptions about missing requirements; flag them explicitly
- DO NOT skip ambiguity detection; highlight ALL unclear requirements
- DO NOT omit risk classification (LOW, MEDIUM, HIGH, CRITICAL)
- ONLY analyze what is explicitly provided or clearly implied
- **BUSINESS RULES FOCUS**: Business rules (BR-XXX) are the primary deliverable and may be as detailed as needed (description, category, priority, source FR reference). DO NOT generate a separate "Functional Requirements" section with FR-XXX narrative blocks, process flows, or per-FR acceptance-criteria breakdowns. DO NOT generate a "Requirements Coverage" summary section. DO NOT generate an "END OF ANALYSIS"/status footer block
- **TOKEN MINIMIZATION**: Output analysis results concisely. Do NOT generate executive summaries, visual diagrams, or extensive supporting documentation
- **FLOW ISOLATION**: ONLY analyze the requirement artifact(s) explicitly provided as `INPUT_PATH`/content in this invocation. DO NOT scan, glob, or read any other files under `./output/`. DO NOT reuse scenarios.md from a different flow/epic/BRD, or from an earlier unrelated run, even if a file already exists at the output path
- **NO FABRICATED / UNGROUNDED BOUNDARY VALUES**: NEVER invent a numeric limit, range, length, size or threshold that the requirement artifact does not state. A boundary scenario may ONLY be generated when the BRD (or an attached interface spec) explicitly defines the limit — e.g. "term must be between 12 and 60 months", "max payload size 1 MB", "loan amount up to 100,000". If the BRD never states a min/max for a field (loan amount, deposit, mileage, payload size, record count), DO NOT generate a boundary scenario for it and DO NOT guess a plausible value. Instead, record it under Ambiguities & Gaps as a missing-limit gap. Every boundary scenario you do generate MUST cite the exact BRD sentence/rule that defines the limit in its Description
- **BOUNDARY VS EDGE CLASSIFICATION**: Type a scenario as `Boundary` ONLY when it exercises a stated numeric/length/range limit at its min, max, min-1 or max+1. A malformed value, a missing field, an unknown identifier, an invalid format, or an unexpected state is NOT a boundary — type those as `Negative`, `Data Validation` or `Edge`. Do not label basic error handling as boundary
- **AUTHENTICATION / AUTHORIZATION COVERAGE (MANDATORY)**: If the requirement artifact mentions authentication, authorization, credentials, tokens, API keys, user roles, permissions or secured/authorized environments — even only in a Scope, Assumptions or Non-Functional section — you MUST extract at least one BR-XXX for it AND include at least one authentication/authorization scenario in the Scenario Inventory. Never drop auth coverage because the BRD lacks a dedicated FR for it; if the mechanism is unspecified, still generate the scenario and log the missing detail under Ambiguities & Gaps
- **OPENAPI / SWAGGER SPEC SCENARIOS ARE MANUAL-ONLY**: Any requirement about an OpenAPI/Swagger/open-spec/`openapi.json` endpoint, API documentation, spec download, or spec viewing is a MANUAL test concern. Still extract its business rules, but set the Scenario Inventory `Track` column to `Manual-Only` for those scenarios and EXCLUDE them from the 3 automation scenarios. They must never be handed to the automation track
- **🚀 FAST MODE - LIMIT TO 3 AUTOMATION SCENARIOS**: Generate ONLY 3 automation-track test scenarios maximum in the Scenario Inventory (3 total SCN-XXX entries with `Track` = `Automation`, across all FRs combined). `Manual-Only` scenarios do not count toward the 3. Required mix: 1 positive/happy path, 1 negative/data-validation error path, and 1 remaining slot filled by — in this priority order — authentication/authorization (when auth is in scope, to satisfy the mandatory auth-coverage rule), otherwise a BRD-grounded boundary scenario, otherwise an additional negative/error-handling scenario, otherwise an edge case. NEVER pad the mix with a fabricated boundary scenario just to fill the slot. You may generate all identified business rules (BR-XXX), but STOP automation scenario generation after 3. This fast mode significantly reduces execution time to ~3 minutes

## Output Path Configuration

**Output Location**: Use the exact `OUTPUT_PATH` provided by QA-Master for the CURRENT flow — `./output/specforge/{BASE_NAME}-BusinessRules.md`, where `{BASE_NAME}` is the Jira epic key (or a BRD filename slug when no Jira epic is used). This is SpecForge's OWN agent-named folder — do not write anywhere else. If invoked standalone without an OUTPUT_PATH, default to `./output/specforge/`.

**ONLY generate this 1 file** (TOKEN MINIMIZATION - no other files):
- `{BASE_NAME}-BusinessRules.md` - Business rules (BR-XXX) and derived test scenarios (SCN-XXX), combined in one file

## Input Format

**Accepts BRD in any format**:
- `.docx` - Microsoft Word Document (PREFERRED)
- `.pdf` - PDF Document
- `.doc` - Older Word Format
- `.txt` - Plain text
- `.md` - Markdown
- Content passed directly from QA-Master (read from file path)

## Procedure

Read the complete supplied artifact; decompose functional/non-functional requirements and extract ALL business rules. Before scenario selection, inventory explicit numeric/length/range/size limits; an empty inventory means no boundary scenario. Apply the three-scenario mix in Constraints, label Manual-Only scenarios separately, and assign unique BR/SCN IDs with requirement traceability. Record all ambiguities, gaps, contradictions and LOW/MEDIUM/HIGH/CRITICAL risks concisely in the same output file.

