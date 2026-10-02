## ⚠️ MANDATORY NAMESPACE-COLLISION RULES (this layout does not compile without them)

The mandated structure creates **two unavoidable name collisions**. Both produce hard compiler errors. Apply these rules in every generated file — they are not optional style preferences.

### Collision 1 — `AutomationFramework.Reqnroll` shadows the real `Reqnroll` package namespace

Any file whose namespace starts with `AutomationFramework.` resolves the simple name `Reqnroll` to the *project's own* `AutomationFramework.Reqnroll` namespace, so `[Binding]`, `DataTable` etc. are not found.

- ❌ `using Reqnroll;`
- ✅ `using global::Reqnroll;`

**Rule**: every file that needs Reqnroll types MUST write `using global::Reqnroll;`. This applies to step definitions, hooks, services and utilities alike.

### Collision 2 — `AutomationFramework.Reqnroll.TestContext` (namespace) shadows the `TestContext` class

The folder `Reqnroll/TestContext/` produces a namespace whose last segment is identical to the class inside it. Within any `AutomationFramework.Reqnroll.*` namespace, the simple name `TestContext` binds to the **namespace**, producing:

```
error CS0118: 'TestContext' is a namespace but is used like a type
```

A using alias placed at the top of the file (before the namespace declaration) does **NOT** fix this — compilation-unit aliases lose to enclosing-namespace member lookup.

- ❌ alias above the namespace declaration:
  ```csharp
  using TestContext = AutomationFramework.Reqnroll.TestContext.TestContext;

  namespace AutomationFramework.Reqnroll.StepDefinitions;   // CS0118
  ```
- ✅ alias **inside** the namespace declaration, `global::`-qualified:
  ```csharp
  namespace AutomationFramework.Reqnroll.StepDefinitions;

  using TestContext = global::AutomationFramework.Reqnroll.TestContext.TestContext;
  ```

**Rule**: any file under `AutomationFramework.Reqnroll.*` that references the `TestContext` class MUST declare the alias *after* the file-scoped namespace declaration and MUST qualify it with `global::`.

Files outside the `AutomationFramework.Reqnroll.*` tree (`Services/`, `Builders/`, `Utilities/`) are unaffected by Collision 2 and may use a normal top-of-file alias, but are still subject to Collision 1.

### Third collision to avoid: NUnit's `TestContext`

`NUnit.Framework` also exposes a `TestContext` type. Any step definition file imports both `NUnit.Framework` and the project's `TestContext`, so the explicit alias above is what disambiguates them. Never rely on bare `TestContext` resolving correctly in a file that also has `using NUnit.Framework;`.

**Feature file handling**: copy the validated `.feature` from `./output/gherkingenie/{BASE_NAME}-Feature.feature` into `Reqnroll/Features/`. Never edit its scenarios. If it contains a `Scenario Outline` / `Examples` (violating standard 7), STOP and report it to QA-Master as a feature-file defect instead of generating bindings for it.

---

