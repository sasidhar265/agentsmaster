# BDDAutomator implementation reference

Apply the active BDDAutomator standards and asset-preservation policy. Read this reference for initial scaffolding; on incremental runs read only the relevant component when a new file/member or a reported defect requires it. Examples are shapes, not permission to invent requirement data.

## Reference Implementation (match these shapes)

### `Reqnroll/TestContext/TestContext.cs` — scenario-scoped shared state

```csharp
using System.Net.Http;
using AutomationFramework.Models;
using AutomationFramework.Utilities;

namespace AutomationFramework.Reqnroll.TestContext;

public class TestContext
{
    public HttpResponseMessage Response { get; set; } = new HttpResponseMessage();
    public string ResponseBody { get; set; } = string.Empty;
    public QuoteRequestModel Request { get; set; } = new QuoteRequestModel();
    public string CorrelationId { get; set; } = string.Empty;

    public int StatusCode => (int)Response.StatusCode;
    public QuoteResponseModel QuoteResponse => JsonUtility.Deserialize<QuoteResponseModel>(ResponseBody);
}
```

### `Reqnroll/Hooks/Hooks.cs` — lifecycle, one HttpClient per run

```csharp
[Binding]
public class Hooks
{
    private readonly TestContext _testContext;

    public Hooks(TestContext testContext)
    {
        _testContext = testContext;
    }

    [BeforeTestRun]
    public static void BeforeTestRun()
    {
        ConfigUtility.Load();
    }

    [BeforeScenario]
    public void BeforeScenario()
    {
        _testContext.CorrelationId = Guid.NewGuid().ToString();
    }

    [AfterTestRun]
    public static void AfterTestRun()
    {
        BaseService.DisposeClient();
    }
}
```

### `Services/{Domain}Service.cs` — the only HTTP call site

```csharp
public class QuoteService : BaseService
{
    private readonly TestContext _testContext;

    public QuoteService(TestContext testContext)
    {
        _testContext = testContext;
    }

    public async Task GenerateQuoteAsync()
    {
        _testContext.Response = await Client.PostAsync(
            ConfigUtility.Endpoint("QuoteEndpoint"),
            JsonUtility.ToJsonContent(_testContext.Request));
        _testContext.ResponseBody = await _testContext.Response.Content.ReadAsStringAsync();
    }
}
```

### `Builders/{Entity}Builder.cs` — fluent, seeded from a `Requests/*.json` payload

```csharp
public class QuoteRequestBuilder
{
    private readonly QuoteRequestModel _model;

    private QuoteRequestBuilder(string requestName)
    {
        _model = TestDataUtility.Request<QuoteRequestModel>(requestName);
    }

    public static QuoteRequestBuilder FromRequestFile(string requestName) =>
        new QuoteRequestBuilder(requestName);

    public QuoteRequestModel Build() => _model;
}
```

Each scenario's payload is a separate `Requests/{TCID}_*.json` artifact, so a variation is expressed by pointing at a different request file — NEVER by an `if` inside the builder. Add `With…()` / `Without…()` mutator methods ONLY when a scenario genuinely needs to alter a loaded payload at runtime; an unused mutator is dead code and violates STD-10.

### `Utilities/TestDataUtility.cs` — loads request payloads and DataTable columns

```csharp
public static class TestDataUtility
{
    public static T Request<T>(string requestName) =>
        JsonUtility.Deserialize<T>(File.ReadAllText(
            Path.Combine(AppContext.BaseDirectory, "Requests", requestName + ".json")));

    public static List<string> Column(DataTable dataTable, string columnName) =>
        dataTable.Rows.Select(row => row[columnName]).ToList();
}
```

File IO lives HERE, never in a step definition (STD-02).

### `Reqnroll/StepDefinitions/{FeatureName}StepDefinition.cs` — calls only

```csharp
using AutomationFramework.Builders;
using AutomationFramework.Services;
using NUnit.Framework;
using global::Reqnroll;

namespace AutomationFramework.Reqnroll.StepDefinitions;

using TestContext = global::AutomationFramework.Reqnroll.TestContext.TestContext;

[Binding]
public class QuoteGenerationStepDefinition
{
    private readonly TestContext _testContext;
    private readonly QuoteService _quoteService;

    public QuoteGenerationStepDefinition(TestContext testContext, QuoteService quoteService)
    {
        _testContext = testContext;
        _quoteService = quoteService;
    }

    [Given("I have a data for the {string} quote generation")]
    public void GivenIHaveADataForTheQuoteGeneration(string productType)
    {
        _quoteService.PrepareValidRequest(productType);
    }

    [Given("the following products exist:")]
    public void GivenTheFollowingProductsExist(DataTable dataTable)
    {
        _quoteService.SeedProducts(dataTable);
    }

    [When("I generate a quote")]
    public async Task WhenIGenerateAQuote()
    {
        await _quoteService.GenerateQuoteAsync();
    }

    [Then("the API responds with HTTP status code {int}")]
    public void ThenTheApiRespondsWithHttpStatusCode(int expectedStatusCode)
    {
        Assert.That(_testContext.StatusCode, Is.EqualTo(expectedStatusCode));
    }

    [Then("the response contains a validation error for field {string}")]
    public void ThenTheResponseContainsAValidationErrorForField(string fieldName)
    {
        Assert.That(_testContext.QuoteResponse.ValidationErrorFields, Does.Contain(fieldName));
    }
}
```

Note the shape: constructor injection only (Reqnroll resolves `TestContext` and Services per scenario), one statement per body, a real assertion in every `Then`, `DataTable` handed straight to the Service. Every setup `Given` delegates to a Service `Prepare*` method — none builds a payload inline (STD-12).

### `Input/TestData.json` — named payload fixtures

```json
{
  "validQuoteRequest": {
    "productType": "PCP",
    "productId": "REPLACE_WITH_PRODUCT_ID",
    "vehicleId": "REPLACE_WITH_VEHICLE_ID",
    "term": 48,
    "amount": 25000.00
  },
  "invalidQuoteRequest": {
    "productType": "PCP",
    "productId": "",
    "vehicleId": "REPLACE_WITH_VEHICLE_ID",
    "term": 48,
    "amount": 25000.00
  }
}
```

### `Input/TestData.json` — authoring source for reference data

`Input/TestData.json` holds reference/lookup data that is NOT a request body — shared identifiers, expected values, environment-specific constants. The request bodies themselves live as standalone artifacts in `Requests/{TCID}_*.json` and are what the Builders load at runtime.

```json
{
  "validQuoteRequest": {
    "productType": "PCP",
    "productId": "REPLACE_WITH_PRODUCT_ID",
    "vehicleId": "REPLACE_WITH_VEHICLE_ID",
    "term": 48,
    "amount": 25000.00
  }
}
```

Both this file and `Requests/*.json` use clearly-named `REPLACE_WITH_*` placeholders for every value the feature file does not state explicitly — never a fabricated identifier, URL, token or credential. `Input/TestData.json` is Tier 1 environment-owned; `Requests/*.json` is Tier 2.

### `appsettings.json`

Endpoints and credentials live in **keyed maps**, never as flat one-off properties. This is what lets a step select a variant by key (`Credential("valid")` / `Credential("invalid")`) instead of branching on it — a flat shape forces an `if`, violating STD-01.

```json
{
  "Api": {
    "BaseUrl": "REPLACE_WITH_BASE_URL",
    "TimeoutSeconds": "30",
    "Endpoints": {
      "QuoteEndpoint": "REPLACE_WITH_QUOTE_ENDPOINT"
    },
    "Credentials": {
      "valid": "REPLACE_WITH_VALID_AUTHORIZATION_HEADER",
      "invalid": "REPLACE_WITH_INVALID_AUTHORIZATION_HEADER"
    }
  }
}
```

### `Utilities/ConfigUtility.cs` — keyed lookup, no branching

```csharp
public static class ConfigUtility
{
    private static IConfigurationRoot _configuration = new ConfigurationBuilder().Build();

    public static void Load()
    {
        _configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", false)
            .Build();
    }

    public static string BaseUrl => _configuration["Api:BaseUrl"];
    public static int TimeoutSeconds => int.Parse(_configuration["Api:TimeoutSeconds"]);
    public static string Endpoint(string endpointName) => _configuration[$"Api:Endpoints:{endpointName}"];
    public static string Credential(string credentialType) => _configuration[$"Api:Credentials:{credentialType}"];
}
```

Variant selection is a dictionary lookup on the step's `{string}` parameter — never an `if` / `switch`.

### `Utilities/JsonUtility.cs` — the ONLY place wire naming is configured

```csharp
public static class JsonUtility
{
    private static readonly JsonSerializerOptions Options = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Options);
    public static T Deserialize<T>(string json) => JsonSerializer.Deserialize<T>(json, Options);
    public static StringContent ToJsonContent<T>(T value) =>
        new StringContent(Serialize(value), Encoding.UTF8, "application/json");
}
```

### `AutomationFramework.csproj`

```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <RootNamespace>AutomationFramework</RootNamespace>
  <AssemblyName>AutomationFramework</AssemblyName>
  <Nullable>disable</Nullable>
  <ImplicitUsings>disable</ImplicitUsings>
  <IsPackable>false</IsPackable>
</PropertyGroup>

<PackageReference Include="Reqnroll.NUnit" Version="3.*" />
<PackageReference Include="Allure.Reqnroll" Version="2.*" />
<PackageReference Include="NUnit" Version="4.*" />
<PackageReference Include="NUnit3TestAdapter" Version="4.*" />
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
<PackageReference Include="Microsoft.Extensions.Configuration.Json" Version="8.*" />
```

`<Nullable>disable</Nullable>` is MANDATORY. With nullable reference types enabled, config and deserialization calls return `string?` / `T?`, and the generated code would need `!`, `??` or `?.` to compile cleanly — all of which STD-08 bans. Disabling nullable is what keeps the framework simultaneously warning-free and branch-free. `<ImplicitUsings>disable</ImplicitUsings>` keeps every using explicit, so the `global::Reqnroll` collision rules stay visible.

`Reqnroll.NUnit` MUST be `3.*`: `Allure.Reqnroll` requires Reqnroll >= 3.0.3, and pinning Reqnroll to `2.*` produces an unresolvable `NU1107` version conflict.

`Input/TestData.json`, `appsettings.json`, `reqnroll.json`, `allureConfig.json` and `Requests/*.json` must be marked `CopyToOutputDirectory=PreserveNewest`. No RestSharp, no SpecFlow, no FluentAssertions.

### `allureConfig.json`

```json
{
  "allure": {
    "directory": "allure-results",
    "title": "{BASE_NAME} — {Feature Name}",
    "links": ["{issue}", "{tms}"]
  }
}
```

`Allure.Reqnroll` writes results to `bin/<Config>/<TFM>/allure-results`, alongside the test assembly — NOT under `TestResults`. RunForge points its reporter at that path.

---

