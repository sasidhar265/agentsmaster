## Language & Stack Constraint

- **C# ONLY** — Reqnroll bindings (`[Binding]`, `[Given]`, `[When]`, `[Then]`). Never Java, Python, JavaScript, Cucumber, SpecFlow or pytest-bdd.
- **Reqnroll + NUnit** for BDD execution and assertions.
- **`HttpClient` ONLY** for HTTP. **RestSharp is BANNED** — never reference, import or generate it.
- **`System.Text.Json`** for serialization.

---

## MANDATORY CODING STANDARDS (NON-NEGOTIABLE)

Every generated file MUST satisfy all numbered standards and additional enforced rules. A violation of any one is a defect that must be fixed before output.

| # | Standard | Meaning in generated code |
|---|---|---|
| 1 | **No `if` / `else` / `switch`** | Zero conditional statements or switch expressions in any file you author. Variation comes from separate `Requests/{TCID}_*.json` payloads, from dedicated builder methods, or from distinct step bindings — never from branching. Reqnroll's generated `*.feature.cs` is excluded. |
| 2 | **No code in Step Definitions** | A step body is ONE statement: a single call to a Service, Builder or TestContext member (optionally `await`ed). No local variables, no parsing, no serialization, no HTTP, no LINQ, no loops, no logging. |
| 3 | **`Then` steps assert** | Every `[Then]` body is exactly one NUnit assertion — `Assert.That(<TestContext or Service member>, Is...);`. Never `Assert.True(true, ...)`, never `PendingStepException`, never a `Then` without an assertion. |
| 4 | **Builder pattern only** | Every request payload/model instance is produced by a fluent `*Builder` (`New()` → `With...()` → `Build()`). Never `new XModel { ... }` object initializers inside steps, services or hooks. |
| 5 | **Service Object Model** | One `*Service` class per API/domain. The Service is the ONLY place an HTTP call exists. Steps never touch HTTP; Services never assert. |
| 6 | **HttpClient, not RestSharp** | A single shared `HttpClient` created once (`BaseService`) and reused for every request. No `RestClient`, `RestRequest`, `IRestResponse`. |
| 7 | **No `Examples`** | Feature files contain NO `Scenario Outline` and NO `Examples` table — only `Scenario` blocks (a Gherkin `DataTable` attached to a step IS allowed). Bindings therefore never bind `<placeholder>` columns. |
| 8 | **No ternary** | No `?:`, no `??`, no `??=`, no `?.` used as branching. Compute values unconditionally or expose a dedicated member. |
| 9 | **Reqnroll** | Reqnroll attributes, `reqnroll.json`, `Reqnroll.NUnit` runner. Never SpecFlow packages or `specflow.json`. |
| 10 | **Reuse everything** | One canonical binding per step text, one Service method per API operation, one Builder per payload, shared `TestContext`, shared `*Utility` helpers, config-driven constants — zero duplicated logic, zero copy-paste, zero dead code. |

Additional enforced rules:
- **NO SERIALIZATION ATTRIBUTES ON MODELS** — never emit `[JsonPropertyName]`, `[JsonProperty]`, `[DataMember]` or any other per-property serialization attribute. Models are plain PascalCase POCOs. Wire naming is configured ONCE, globally, in `JsonUtility`:
  ```csharp
  private static readonly JsonSerializerOptions Options = new JsonSerializerOptions
  {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
      PropertyNameCaseInsensitive = true
  };
  ```
  Per-property attributes duplicate that single policy on every field, add noise, and drift out of sync — one policy, applied everywhere.
- **SYMMETRIC SETUP STEPS** — when several `Given` steps prepare a request, they must ALL follow the same pattern. If the invalid-request step delegates to `_service.PrepareInvalidRequest(...)`, the valid-request step MUST delegate to `_service.PrepareValidRequest()`. Never mix an inline builder chain in one Given with a service call in another; asymmetry between sibling steps is a defect.
- **No orphan / missing bindings** — exactly one binding per distinct feature step text, 1:1 with the feature file.
- **Cucumber Expressions, not regex** — `[Then("the API responds with HTTP status code {int}")]`, never `[Then(@"...(.*)")]` or verbatim strings.
- **No step-calls-step** — a binding never invokes another binding method.
- **No hardcoded URLs or secrets** — base URL, endpoints and credentials come from `appsettings.json` placeholders (`"BaseUrl": "REPLACE_WITH_BASE_URL"`). Never invent a real URL, token or key.
- **No comments** except a single short line where behaviour genuinely cannot be inferred from the code. No XML doc blocks, no `// TODO`, no banner comments.
- **Async correctness** — `async Task` step/service methods with `await`. Never `.Result`, `.Wait()` or `async void`.

---

