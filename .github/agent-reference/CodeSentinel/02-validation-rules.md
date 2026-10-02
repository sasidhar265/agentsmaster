## Validation Rule Set

### A. Coding Standards (each maps to a numbered standard; any violation = FAIL)

| Rule | Detects | FAIL when found |
|---|---|---|
| **STD-01 No conditionals** | `if (`, `else`, `switch`, `switch {`, `when (` in any `.cs` file | any occurrence |
| **STD-02 No code in step definitions** | step method bodies in `Reqnroll/StepDefinitions/*.cs` | body has more than one statement, declares a local variable, parses/serializes data, calls `HttpClient`, uses LINQ or a loop, or logs |
| **STD-03 Then asserts** | `[Then(...)]` method bodies | body lacks `Assert.`, uses `Assert.True(true`, `Assert.Pass()`, or throws `PendingStepException` |
| **STD-04 Builder pattern** | `new *Model {` / `new *Request(` object initializers outside `Builders/` | payload constructed without a `*Builder` fluent chain ending in `.Build()` |
| **STD-05 Service Object Model** | `HttpClient`, `PostAsync`, `GetAsync`, `SendAsync` outside `Services/` | HTTP call in steps, hooks, builders, models or utilities; or `Assert.` inside `Services/` |
| **STD-06 HttpClient not RestSharp** | `RestSharp`, `RestClient`, `RestRequest`, `IRestResponse` | any occurrence (also in `.csproj`) |
| **STD-07 No Examples** | `Scenario Outline`, `Examples:`, `<placeholder>` in `.feature`; `{placeholder}` columns bound from Examples | any occurrence |
| **STD-08 No ternary** | `? :` expressions, `??`, `??=`, `?.` used as branching | any occurrence |
| **STD-09 Reqnroll** | `SpecFlow`, `TechTalk.SpecFlow`, `specflow.json`, `xunit`, `MSTest` | any occurrence; also FAIL if `Reqnroll.NUnit` or `reqnroll.json` is missing |
| **STD-10 Reuse** | duplicate step text, duplicate Service method doing the same call, copy-pasted blocks (≥5 identical lines in 2+ places), unused private members, hardcoded values repeated 3+ times | any occurrence |
| **STD-11 No serialization attributes** | `[JsonPropertyName`, `[JsonProperty`, `[DataMember`, `[JsonIgnore` in `Models/` | any occurrence — wire naming must come from `JsonUtility`'s single `PropertyNamingPolicy = JsonNamingPolicy.CamelCase` |
| **STD-12 Symmetric setup steps** | sibling `Given` steps that prepare a request | one delegates to a Service `Prepare*` method while another builds inline — all sibling setup steps must use the same pattern |

### B. Structure & Naming (any violation = FAIL)

Required layout under `AutomationFramework/`:
`Reqnroll/Features`, `Reqnroll/StepDefinitions`, `Reqnroll/Hooks`, `Reqnroll/TestContext`, `Services`, `Builders`, `Models`, `Utilities`, `TestResults/Reports`, `Input/TestData.json`, plus `AutomationFramework.csproj`, `reqnroll.json`, `appsettings.json`. A `Requests/` folder holding `{TCID}_{ScenarioName}Request.json` payloads is also required whenever the feature file contains API scenarios.

- File suffixes: `*StepDefinition.cs`, `*Service.cs`, `*Builder.cs`, `*Model.cs`, `*Utility.cs`, `Hooks.cs`, `TestContext.cs`
- Namespaces mirror folders
- No file outside the layout; no empty required folder (except `TestResults/Reports`)

### C. Binding Coverage (any violation = FAIL)

- Every distinct step text in the feature file has exactly ONE binding (no missing, no orphan, no duplicate)
- Bindings use Cucumber Expressions (`{string}` / `{int}` / `{float}`) — no regex or `@`-verbatim attributes
- `And` / `But` bound with the keyword they continue
- No binding calls another binding

### D. Safety & Configuration (any violation = FAIL)

- No hardcoded base URL, endpoint, token, API key, password or connection string in `.cs` files — must come from `appsettings.json`
- No secrets committed anywhere in the framework — a live API key, bearer token, password or connection string with embedded credentials in ANY file is a CRITICAL violation

**A real URL in `appsettings.json` or a real identifier in `Input/TestData.json` is NOT a violation.** These two files are environment-owned: pointing them at `http://localhost:5000` or a real product id is the DESIRED end state, and is exactly what RunForge requires in order to execute. Configuration is the correct home for such values — that is the point of externalising them.

- ❌ NEVER report a real base URL, endpoint path or business identifier in `appsettings.json` / `Input/TestData.json` as a violation
- ❌ NEVER instruct BDDAutomator to revert a real configured value back to a `REPLACE_WITH_*` placeholder. Doing so breaks the user's environment and creates a rework loop that repeatedly destroys their configuration
- ✅ A remaining `REPLACE_WITH_*` placeholder is an INFO-level observation for RunForge's preflight, not a CodeSentinel violation
- ✅ DO still fail on a credential **literal embedded in a `.cs` file**, and on anything that looks like a live secret (API key, bearer token, password, connection string with credentials) regardless of which file it sits in

### E. Compilation Gate

Run `dotnet build` on `AutomationFramework.csproj` when the .NET SDK is available. Compilation errors = FAIL; warnings are reported as MINOR. If the SDK is unavailable, record `Compilation: SKIPPED (SDK not available)` — this does not by itself fail the gate.

---

