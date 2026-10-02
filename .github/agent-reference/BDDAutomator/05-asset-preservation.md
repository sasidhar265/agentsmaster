## 🔒 ASSET PRESERVATION POLICY (PRIORITY: HIGHEST — SUPERSEDES ALL GENERATION INSTRUCTIONS)

The `AutomationFramework` project is the **source of truth**. Once a file exists on disk it is owned by the framework, not by this agent. Re-running BDDAutomator against a `{BASE_NAME}` that already has a framework is an **incremental, additive** operation — never a regeneration.

This policy overrides every other instruction in this document relating to scaffolding, framework generation, service/builder/model/utility generation, configuration generation, refactoring, modernization, file replacement and template regeneration.

### Decision matrix — run this for EVERY file BEFORE writing anything

| Condition | Action |
|---|---|
| Path exists AND is Tier 1 (Environment-Owned) | **LEAVE — never touch, not even to reformat** |
| Path is `Reqnroll/Features/{BASE_NAME}.feature` AND GherkinGenie's validated output differs | **SYNC — replace the mirrored copy** |
| Path exists AND is Tier 2 AND needs a NEW member to cover a new feature step | **EXTEND — insert only that member, in place** |
| Path exists AND is Tier 2 AND needs nothing | **LEAVE — read, reference, import, consume** |
| Path exists AND CodeSentinel reported a violation in THAT EXACT FILE | **PATCH only the reported lines** (REWORK MODE) |
| Path does not exist | **CREATE** |

Check existence first, write second. A file you did not have to rewrite costs zero tokens — that is the entire point of this policy.

**EXTEND is never a rewrite.** Adding a member to an existing class means inserting that member and nothing else. Emitting the whole file with the member included is a rewrite and is forbidden, even when the resulting content looks correct.

### Tier 1 — Environment-Owned (NEVER written after first creation, under ANY circumstance)

| File | Why it is sacred |
|---|---|
| `appsettings.json` | Holds the real base URL, endpoints and credentials for the target environment |
| `Input/TestData.json` | Holds real business identifiers and payload fixtures |

**These two files belong to the user, not to the agent.** They are the only mechanism for pointing the suite at a real or locally-hosted API.

- ❌ NEVER overwrite them
- ❌ NEVER revert a real value (e.g. `http://localhost:5000`) back to a `REPLACE_WITH_*` placeholder — a real value present in config is the DESIRED end state, not a violation
- ❌ NEVER normalise, reformat, reorder or re-indent them
- ❌ NEVER remove a key you did not add
- ✅ You MAY create them once, if genuinely absent, using `REPLACE_WITH_*` placeholders
- ✅ You MAY **append a missing key** that newly generated code requires — adding `Api:Endpoints:NewEndpoint` is allowed; altering `Api:BaseUrl` is not
- ✅ If a required key is missing, REPORT it to QA-Master instead of rewriting the file

### Tier 2 — Framework-Owned (SKIP when present)

| Folder | Files |
|---|---|
| `Reqnroll/Features/` | `{BASE_NAME}.feature` |
| `Reqnroll/StepDefinitions/` | `*StepDefinition.cs` |
| `Reqnroll/Hooks/` | `Hooks.cs` |
| `Reqnroll/TestContext/` | `TestContext.cs` |
| `Services/` | `BaseService.cs`, `*Service.cs` |
| `Builders/` | `*Builder.cs` |
| `Models/` | `*Model.cs` |
| `Utilities/` | `ConfigUtility.cs`, `JsonUtility.cs`, `TestDataUtility.cs` |
| `Requests/` | `{TCID}_{ScenarioName}Request.json` |
| root | `AutomationFramework.csproj`, `reqnroll.json` |

Protected files may be **read, referenced, imported and consumed** freely. Their EXISTING contents remain unchanged.

❌ Do not recreate · regenerate · overwrite · refactor · reformat · rename · delete · remove-and-recreate · replace · duplicate · create V2 variants · "improve" · "modernise"

✅ You MAY insert a NEW member into a protected class when a new feature step requires it (see Incremental additions). That is an in-place extension, not a regeneration — every pre-existing line stays byte-identical.

### The two legitimate ways a protected file changes

1. **EXTEND** — a new feature step needs a binding, a new API operation needs a service method, a new assertion needs a TestContext member. Insert only that member.
2. **PATCH** — QA-Master forwards a CodeSentinel violation report naming that exact file and line. Fix the reported violation in place, change nothing else, do not reformat surrounding code.

`Reqnroll/Features/{BASE_NAME}.feature` is the single exception to "contents remain unchanged": it is a mirror of GherkinGenie's validated output and is re-synced whenever the source differs. Never hand-edit it — only ever replace it with the validated source.

### Incremental additions

When the feature file gains a NEW step that no existing binding covers:

- ✅ INSERT the binding method into the EXISTING `*StepDefinition.cs` — do not rewrite the class
- ✅ INSERT a new `With…()` method into the EXISTING builder, if the scenario must mutate a loaded payload
- ✅ INSERT a new method into the EXISTING service
- ✅ CREATE a new `Requests/{TCID}_*.json` if the scenario needs a payload no existing file provides
- ❌ Do NOT regenerate a whole file merely to introduce one new member
- ❌ Do NOT touch any class that needs no new member

