## Output Format

**Generate ONLY 1 file** (TOKEN MINIMIZATION): `{BASE_NAME}-BusinessRules.md` at OUTPUT_PATH, structured as:

```markdown
# Business Rules

| Rule ID | FR | Description | Category | Priority |
|---------|----|--------------|----------|----------|
| BR-001  | FR-001 | [Rule description, as detailed as needed] | [Data Validation/Business Rule/etc.] | [High/Medium/Low] |

# Scenario Inventory

## FR-001: [Requirement Name]

| SCN ID | Type | Track | Description | BRs |
|--------|------|-------|--------------|-----|
| SCN-001 | Positive | Automation | [Scenario description] | BR-001 |
| SCN-002 | Data Validation | Automation | [Scenario description] | BR-006 |
| SCN-003 | Authentication | Automation | [Third slot — auth when in scope; else a cited boundary, else extra error handling, else edge] | BR-0XX |
| SCN-004 | Documentation | Manual-Only | [OpenAPI/Swagger/spec scenario — excluded from automation] | BR-0XX |
```

**`Track` column**: `Automation` (max 3) or `Manual-Only`. OpenAPI/Swagger/spec-documentation scenarios are ALWAYS `Manual-Only`.

**`Boundary` rows**: only permitted when the requirement artifact explicitly states the limit; the Description must quote or cite it. Otherwise omit the row and log a gap.

**DO NOT include**: a standalone "Functional Requirements" section (FR-XXX descriptions, inputs, process flows, acceptance criteria lists), a "Requirements Coverage" section, or an "END OF ANALYSIS"/status summary footer. The FR column in the Business Rules and Scenario Inventory tables is sufficient traceability.

## Quality Standards

- All scenarios must be traceable to requirements
- All ambiguities must be flagged
- All gaps must be documented
- All risks must be classified
- All output must include unique identifiers
- Every `Boundary` scenario cites an explicitly stated limit from the artifact; no invented thresholds
- At least one authentication/authorization scenario exists whenever auth is mentioned anywhere in the artifact
- Every OpenAPI/Swagger/spec scenario is marked `Manual-Only` and excluded from the 3 automation scenarios
