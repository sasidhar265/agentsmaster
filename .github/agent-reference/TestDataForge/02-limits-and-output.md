## Grounded Limits (from the source payload contract — these DO justify boundary tests)

| Field | Stated limit | Boundary values to emit |
|---|---|---|
| `parameters.term` | not more than 120 months, new or used | 1, 120 (valid) · 0, 121 (invalid) |
| `parameters.deposit` | not more than 70% of `vehicle.priceTotal` | 70% exactly (valid) · 70% + 0.01 (invalid) |
| `parameters.partExchange` | not more than 90% of `vehicle.priceTotal` | 90% exactly (valid) · 90% + 0.01 (invalid) |
| `vehicle.mileage` | 0 for new vehicles, actual for used | New + mileage 0 (valid) · New + mileage > 0 (invalid) |
| `vehicle.registrationDate` | today for new, first registration date for used | consistent with `vehicleCondition` |
| `vehicle.vehicleCondition` | `New` or `Used` | any other value (invalid) |
| `identifiers[].identifierType` | `VIN`, `CapCode`, `MBV` | any other value (invalid) |

Percentage limits are computed against the **actual `priceTotal` in the dataset**, never hardcoded. These are the ONLY boundaries you may emit — any limit not stated above is ungrounded and is forbidden (see Constraints).

---

## Reusable Script Management (Shared Scripts Folder)

**Canonical script**: `./scripts/TestDataForge-Generator.py` — shared infrastructure in the same `./scripts/` folder used by every other agent.

1. **Check first**: before writing any data-generation code, verify the script exists.
2. **IF IT EXISTS**: reuse it as-is — `python ./scripts/TestDataForge-Generator.py --source "<SOURCE>" --output "<OUTPUT_PATH>" --seed <SEED>`
3. **IF MISSING**: create it ONCE, parameterised via CLI arguments so it works unmodified for every future flow.
4. **IF LOGIC MUST CHANGE**: edit that file in place. NEVER create `-v2` / `-new` duplicates.
5. NEVER write one-off inline Python (`python -c "..."`) for data generation once the shared script exists.
6. **NEVER DELETE THE SCRIPT AFTER USE** — it is permanent infrastructure.

Generation MUST be deterministic: the same `--seed` and the same source payload always produce byte-identical output, so reruns do not churn diffs.

---

## Output Path Configuration

**Output Location**: use the exact `OUTPUT_PATH` given by QA-Master — `./output/testdataforge/{BASE_NAME}-TestData.json`, TestDataForge's OWN agent-named folder.

**ONLY generate this 1 file**:
- `{BASE_NAME}-TestData.json` — every fixture plus a `_meta` block carrying seed, provenance, resolved identifiers and grounded limits

### Relationship to the framework's `Input/TestData.json` (CRITICAL)

`AutomationFramework/Input/TestData.json` and `appsettings.json` are **Tier 1 environment-owned** files under BDDAutomator's Asset Preservation Policy.

- ✅ ALWAYS write your deliverable to `./output/testdataforge/`
- ✅ You MAY copy fixtures into `Input/TestData.json` **only on an explicit instruction** from QA-Master or the user
- ❌ NEVER silently overwrite `Input/TestData.json`
- ❌ NEVER touch `appsettings.json` — endpoints and credentials are not test data
- ❌ NEVER replace a real configured value with a `REPLACE_WITH_*` placeholder

---

