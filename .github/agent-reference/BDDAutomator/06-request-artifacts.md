## 📦 API REQUEST ARTIFACT POLICY

Every executable API scenario gets a standalone request payload JSON under `Requests/`, so large bodies never live inside step definitions.

### Location & naming

`AutomationFramework/Requests/{TCID}_{ScenarioName}Request.json`

Use the TestCraft TCID (`QT_001`, `QT_002`, …) so each payload traces back to its manual test case:

- `QT_001_ValidFinanceCalculationRequest.json`
- `QT_002_InvalidVehicleDataRequest.json`

### Payload source priority

0. `./input/{BASE_NAME}-PayloadSchema.json` (Tier 0 — the business-supplied contract; see "Payload schema contract" below)
1. `Input/TestData.json` fixtures (Tier 1 — authoritative real data)
2. `Builders/*Builder.cs` shape
3. `Models/*Model.cs` shape
4. The feature file's DataTable values

`Scenario Outline` / `Examples` are BANNED by STD-07 and are therefore never a payload source.

### Payload schema contract (Tier 0 — READ FIRST)

When `./input/{BASE_NAME}-PayloadSchema.json` exists it is the **authoritative field/type/constraint reference** for that epic, and it outranks every shape you would otherwise infer from the feature file or the sample payload.

Read it BEFORE creating or extending any `*Model.cs`, `*Builder.cs` or `Requests/*.json`, and conform to it:

- **Models** mirror the schema tree — one POCO per object node, property names PascalCased from the schema keys, CLR types from the schema `type` (`string` → `string`, `integer` → `int`, `number` → `decimal`, `array` → `List<T>`). Still plain POCOs with no serialization attributes (STD-11).
- **Builders** expose one `With*` method per **leaf field** in the schema, so any endpoint payload can be assembled fluently without an object initializer (STD-04). A builder that covers only the fields the current feature file happens to touch is incomplete — the whole point is that the next scenario needs no builder change.
- **Requests/`{TCID}_*.json`** instances must validate against the schema.
- **`x-businessRules`** entries with `"boundary": true` are the ONLY grounded numeric limits for the epic. Boundary payloads may be built against those and no others.
- **`x-openList: true`** fields (e.g. manufacturer, financeType) must NOT become a C# `enum` or a closed validation set — the business marked them non-exhaustive.
- **`x-conflict` / `unresolved: true`** entries are unresolved business questions. Carry the value verbatim, do not pick a side, and surface the conflict in your close-out report.
- **`x-constraintSource: "derived"`** means inferred, not stated. Never assert a rejection on a derived rule as though it were a requirement.

If no schema file exists for the epic, fall back to priority 1-4 above.

### How step definitions consume them — STD-02 still applies in full

A step body remains exactly ONE call. The request file is loaded by a **Utility**, shaped by a **Builder** and sent by a **Service**:

`Requests/*.json` → `TestDataUtility` / `JsonUtility` → `*Builder` → `*Model` → `*Service` → API

- ✅ `_testContext.Request = FinanceCalculationRequestBuilder.FromRequestFile("QT_001_ValidFinanceCalculationRequest").Build();`
- ❌ `File.ReadAllText`, path building, deserialization or any other IO inside a `[Given]` / `[When]` / `[Then]` body

Mark `Requests/*.json` as `CopyToOutputDirectory=PreserveNewest` in the `.csproj`.

### Reuse

`Requests/` is Tier 2 protected. If an equivalent payload already exists and satisfies the scenario, REUSE it. Create a new file only for a genuinely new scenario.

---

