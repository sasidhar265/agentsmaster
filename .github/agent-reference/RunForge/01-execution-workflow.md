## Input / Output

- **INPUT_PATH**: `./output/bddautomator/AutomationFramework/AutomationFramework.csproj` (CURRENT flow only)
- **OUTPUT_PATHS**:
  - `./output/bddautomator/AutomationFramework/TestResults/` — raw `.trx` result file and build log
  - `./output/bddautomator/AutomationFramework/TestResults/Reports/{BASE_NAME}-AllureReport.html` — single-file Allure dashboard
  - `./output/runforge/{BASE_NAME}-ExecutionSummary.md` — short markdown summary
- **FLOW ISOLATION**: execute ONLY the framework at the given INPUT_PATH.

## Canonical Reporting Script (reuse, never duplicate)

`./scripts/TestExecution-AllureReporter.ps1` renders the Allure results produced by the `Allure.Reqnroll` package into a **single-file** HTML report. It already exists — **invoke it, do not rewrite it**. Edit it in place ONLY when the report logic itself must change; never create a `-v2` / `-new` copy.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/TestExecution-AllureReporter.ps1 `
  -ResultsPath ./output/bddautomator/AutomationFramework/bin/Release/net8.0/allure-results `
  -OutputPath  ./output/bddautomator/AutomationFramework/TestResults/Reports/{BASE_NAME}-AllureReport.html `
  -Title       "{BASE_NAME} — Reqnroll Execution Report"
```

**Why `--single-file` is mandatory**: a standard multi-file Allure report cannot be opened over `file://` — the browser blocks the XHR that loads its JSON, so the report renders blank. The single-file build is self-contained and opens directly by double-click. Never publish a multi-file Allure directory as the deliverable.

**Allure CLI resolution**: the script uses `allure` when on PATH, otherwise falls back to `npx --yes allure-commandline@2` (requires Node.js and Java). On Windows `npx` resolves to `npx.ps1`, which PowerShell's call operator cannot pass array arguments to — the script therefore shells out via `cmd /c`. Do not "simplify" that back to `& npx`.

**Results location**: `Allure.Reqnroll` writes `allure-results` next to the test assembly (`bin/<Config>/<TFM>/allure-results`), NOT under `TestResults`. Always point `-ResultsPath` at the assembly-adjacent folder.

## Execution Sequence

1. **Preflight**
   - Verify the .NET SDK is available (`dotnet --version`). If `dotnet` is not on PATH, also probe the common user-scope and machine-scope install locations before concluding it is missing: `%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe` and `C:\Program Files\dotnet\dotnet.exe`. Use the full path for every subsequent command when it is not on PATH. Only if no SDK is found anywhere, STOP and report `BLOCKED: .NET SDK not available` — do not attempt an install.
   - Verify `appsettings.json` and `Input/TestData.json` contain no remaining `REPLACE_WITH_*` placeholders. If any remain, STOP and report `BLOCKED: unresolved configuration placeholders`, listing each key — tests cannot be run against a placeholder endpoint.
2. **Restore & build**: `dotnet restore` then `dotnet build --no-restore -c Release`, teeing output to `TestResults/{BASE_NAME}-run.log`. A build failure ends the run with verdict `BUILD FAILED` plus the compiler errors.
3. **Test**: `dotnet test --no-build -c Release --logger "trx;LogFileName={BASE_NAME}.trx" --results-directory ./TestResults`
4. **Report**: run the canonical Allure reporter script above to produce the single-file dashboard.
5. **Summarize**: write `./output/runforge/{BASE_NAME}-ExecutionSummary.md`.

## Allure Dashboard Contents

- Overview: total / passed / failed / broken / skipped, pass-rate donut, run duration
- Suites and Behaviors views, grouped by feature and scenario
- Per-scenario Given/When/Then step breakdown with per-step status and timing
- Failure detail: assertion message, exception type and full stack trace
- Categories view classifying product defects vs test defects
- Environment panel (report title, generation timestamp) from `environment.properties`

