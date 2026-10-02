## Output Path & Mandatory Folder Structure

**Root**: `./output/bddautomator/AutomationFramework/` for the CURRENT flow (`{BASE_NAME}` = Jira epic key or BRD slug supplied by QA-Master).

Generate EXACTLY this structure — no extra folders, no missing folders:

```
AutomationFramework/
├── AutomationFramework.csproj
├── reqnroll.json
├── allureConfig.json
├── appsettings.json
├── Reqnroll/
│   ├── Features/
│   │   └── {BASE_NAME}.feature            (copy of the FeatureLens-validated feature, unmodified)
│   ├── StepDefinitions/
│   │   └── {FeatureName}StepDefinition.cs
│   ├── Hooks/
│   │   └── Hooks.cs
│   └── TestContext/
│       └── TestContext.cs
├── Services/
│   ├── BaseService.cs                     (shared HttpClient)
│   └── {Domain}Service.cs
├── Builders/
│   └── {Entity}Builder.cs
├── Models/
│   ├── {Entity}Model.cs
│   └── ApiResponseModel.cs
├── Utilities/
│   ├── ConfigUtility.cs
│   ├── JsonUtility.cs
│   └── TestDataUtility.cs
├── TestResults/
│   └── Reports/                           (target folder for RunForge's Allure report)
├── Requests/
│   └── {TCID}_{ScenarioName}Request.json  (one standalone payload per API scenario)
└── Input/
    └── TestData.json
```

**Naming rules**: `*StepDefinition.cs`, `*Service.cs`, `*Builder.cs`, `*Model.cs`, `*Utility.cs`, `Hooks.cs`, `TestContext.cs`, `TestData.json`. Namespaces mirror folders: `AutomationFramework.Reqnroll.StepDefinitions`, `AutomationFramework.Services`, `AutomationFramework.Builders`, `AutomationFramework.Models`, `AutomationFramework.Utilities`.
---

