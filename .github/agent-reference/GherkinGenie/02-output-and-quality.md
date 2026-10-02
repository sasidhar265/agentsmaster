## Output Format

**Generate SINGLE feature file** (all test scenarios for one BRD in one .feature file):

**Output File**: `{BASE_NAME}-Feature.feature` (ONE file per BRD, at OUTPUT_PATH)

**IMPORTANT - NUMBERING RULES**:
- DO NOT include scenario numbers in scenario names (NO "SCN-001 - Scenario Name" format)
- DO include scenario names as: "[Scenario business description]" WITHOUT numbering
- NEVER add tags: every scenario is completely tag-free — no filtering tags, no FR/BR/SCN identifier tags, no exceptions
- MANDATORY structural mix: exactly 1 scenario with a DataTable and exactly 2 plain scenarios (3 total); ZERO `Scenario Outline` / `Examples`
- DO NOT append a "SCENARIO STATISTICS" or coverage-summary comment block at the end of the file

```gherkin
Feature: [Feature Name from BRD]
  As a [actor/role]
  I want to [capability]
  So that [business value]

  Background:
    Given [common precondition 1]
    And [common precondition 2]

  Scenario: [DataTable Scenario Name — happy path]
    Given the following [data description]:
      | column1 | column2 |
      | value1  | value2  |
    When [action from test scenario]
    Then [expected result referencing the table data]

  Scenario: [Data Validation Scenario Name]
    Given [precondition]
    When [action using "a quoted value"]
    Then [expected result referencing "a quoted value"]

  Scenario: [Remaining Scenario Name — auth, negative, or edge case]
    Given [precondition]
    When [action]
    Then [expected result]
```

**Output Deliverables**:
- ONE `{BASE_NAME}-Feature.feature` per BRD
- All test scenarios for that BRD in the SAME file
- No tags anywhere in the file; no trailing statistics/summary section
- Exactly 3 scenarios: 1 with a DataTable, 2 plain scenarios — no `Scenario Outline`, no `Examples`

**No Multiple Files**: All scenarios consolidated into one feature file per BRD
**File Naming**: Use the canonical BASE_NAME and OUTPUT_PATH above.

## Quality Standards

- All scenarios are traceable to SCN-XXX identifiers
- All steps follow Given-When-Then structure
- Use quoted parameters, DataTable values or external data; never `<placeholder>` / Examples syntax
- All scenarios are independent and reusable
- No tags anywhere — every scenario is completely untagged
- Exactly 3 scenarios total: 1 uses a Gherkin DataTable and 2 are plain Scenario blocks with no table
- ZERO occurrences of `Scenario Outline` and `Examples` in the file
- Steps are written in business language, not implementation details
- Each scenario tests one behavior
- Preconditions are complete and unambiguous
- No "SCENARIO STATISTICS" or coverage-summary block at the end of the feature file
- No two scenarios are near-duplicates differing only in a data value (consolidate with a DataTable instead)
- No two scenarios validate the same business rule/behavior under different names
- No scenario requires subjective/manual/visual judgment to verify (such requirements are omitted, not automated)
- Identical checks reuse identical step wording across the whole file (no near-synonym step variants)
- No scenario concerns an OpenAPI/Swagger/spec/API-documentation endpoint
- No two assertion steps within a scenario assert the same observable outcome
- Every boundary scenario cites an explicitly stated limit; no invented thresholds, and no error-handling scenario is classified/selected as boundary
- At least one authentication/authorization scenario exists whenever auth is mentioned in the requirement artifact
- No performance, latency, load or payload-size scenarios
