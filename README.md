# QA Studio — C# Razor Pages

QA Studio is a standalone ASP.NET Core Razor Pages application in `src/QaStudio.Web`. The UI uses `.cshtml` pages with C# page models instead of MVC page controllers and views. UI hosting, API endpoints, run storage, job orchestration, TRX parsing, and ZIP exports are implemented in C#. The application does not start a Node.js server, proxy to Node.js, or require npm or Python. JavaScript in `wwwroot` runs only in the browser for uploads, live updates, navigation, theme preferences, and charts.

## Start

Install the .NET 10 SDK, then run from the Demo folder:

```sh
dotnet build QaStudio.slnx
dotnet run --project src/QaStudio.Web
```

Open http://localhost:3000. For development with automatic refresh:

```sh
dotnet watch --project src/QaStudio.Web
```

The application uses the existing `.github` agents, `input` files, and `.qa-runs` directory at the Demo root. Existing saved runs remain readable. Only one C# instance can own a workspace at a time. Ctrl+C stops the application and active child jobs. Unfinished runs are marked interrupted on restart.

Generation requires a separately installed, authenticated Codex CLI (`codex login`) by default. It is invoked only for generation jobs or the runner availability check. Direct BDD execution invokes the .NET CLI and does not use an AI model. The UI itself works without a model CLI installed and reports its availability.

## Project structure

- `src/QaStudio.Web/Controllers`: native run API controller.
- `src/QaStudio.Web/Models`: typed Razor view model, run requests, and persisted run records.
- `src/QaStudio.Web/Pages`: Razor Pages entry point and C# page model, with shared Razor screens for generation, execution, test data, dashboard, history, results, and layout/dialogs.
- `src/QaStudio.Web/Services`: C# workspace persistence, process execution, run orchestration, progress, and reporting.
- `src/QaStudio.Web/wwwroot`: browser CSS and JavaScript; no frontend package installation or build step.
- `tests/QaStudio.IntegrationTests`: dependency-free C# integration checks and fixture executable.
- `legacy/node-ui`: retired implementation retained for reference; excluded from the C# solution and runtime.

## Agent instructions

Agent entry points in `.github/agents` define roles, runner metadata, and handoffs. Each loads its procedure from `.github/skills/<skill-name>/SKILL.md`. Skills own distinct inputs, decisions, outputs, and verification and can be read directly without loading an agent. Detailed standards and artifact templates remain under `.github/agent-reference`.

QA Studio recursively assembles agent → skill → required references into each run's agent files before starting Codex or Copilot. It strips skill metadata and rejects missing, circular, escaped, or symbolic-link dependencies. Optional examples are loaded only when needed; required standards stay fully inline. See the [agent maintenance guide](.github/agent-reference/README.md). Keep the full `.github` tree together when copying agents to another workspace.

Runner and profile settings live in [.github/agent-config.json](.github/agent-config.json). Copilot settings map each custom agent to its model and tool list; `"inherit"` uses the session model, and `"request"` uses the model selected for the run. Set a Copilot agent to one of the model IDs listed by the UI to pin that profile. Codex settings apply to the whole CLI session: `model: "inherit"` uses the installed Codex default, and `sandbox` accepts `read-only` or `workspace-write`. This integration cannot reliably enforce different Codex models or tool permissions for individual delegated agents, so per-agent tool lists apply to Copilot profiles only. QA Studio validates the config and agent names while staging; a missing profile, invalid model, or missing module stops the run with a clear error.

## Validation

```sh
dotnet run --project tests/QaStudio.IntegrationTests
```

The C# suite builds the web project, launches it against a temporary workspace, and uses its own C# fixture executable. The web host runs with an empty executable search path to verify that Node.js and Python are unnecessary. Checks cover Razor rendering, static assets, access restrictions, validation, input staging, agent events, cancellation, persisted runs, namespace-aware TRX parsing, usage metrics, ZIP downloads, and direct BDD success/failure/blocked states. No model calls or real application tests are performed by this suite.

## Configuration

| Setting | Purpose |
| --- | --- |
| `ASPNETCORE_URLS` | UI binding; default `http://127.0.0.1:3000` |
| `Workspace__Root` | Absolute path to Demo when running from a different layout or published directory |
| `QA_RUNNER` | `codex` (default) or `copilot` |
| `QA_CODEX_BIN` | Codex executable override |
| `QA_COPILOT_BIN` | Copilot executable override |
| `QA_DOTNET_BIN` | .NET executable override for direct BDD jobs |

To use the Copilot runner, authenticate with `copilot login` and select **GitHub Copilot Enterprise** in an agent workflow. The LLM provider and model selectors use the Copilot CLI's `--model` option; **Auto** lets Copilot choose. `QA_RUNNER=copilot` sets the initial UI choice. Your enterprise model policy and installed CLI version determine which listed models you can actually run. Direct BDD execution does not use an AI model. Runner flags preserve the previous sandbox and tool-permission behavior: Codex uses `workspace-write`; Copilot uses `--allow-all-tools`. The app passes arguments directly without a shell.

To publish:

```sh
dotnet publish src/QaStudio.Web -c Release -o publish
```

Run the published application with its working directory set to `publish` and `Workspace__Root` set to the absolute Demo path. The workspace remains separate from published UI files. No Node.js or Python service is needed.

## Workflows

Submit a prompt, up to 10 supporting documents (10 MB each), or a Jira reference. Supported formats are PDF, DOCX, XLSX, TXT, Markdown, JSON, CSV, and Gherkin. Requests are limited to 30 MB including base64 encoding and 20,000 prompt characters.

- **Test generation:** requirements analysis (Pattern 1), manual tests (Pattern 2), automation (Pattern 3), or full coverage (Pattern 4). QA-Master routes specialist work and quality gates using the existing agent definitions.
- **Test case run:** select an existing generated framework or `output/bddautomator/AutomationFramework/AutomationFramework.csproj` from the workspace. Direct .NET execution is the default; QA-Master/CodeSentinel/RunForge orchestration remains selectable as Pattern 10.
- **Test data:** Pattern 11 stages an existing `input/*-SourcePayload.json` or uploaded JSON plus an optional schema, preserving exact dataset filenames. TestDataForge specializes in UK automotive finance data.
- **BRD review:** Pattern 12 assesses uploaded requirement documents for domain context, business outcomes, measurable success criteria, consistency, and readiness. DomainOutcomeValidator produces an evidence-cited assessment without editing the source.
- **Dashboard:** inspect recorded test outcomes, failures, timing, model usage, and configurable cost estimates.
- **Recent runs:** reopen persisted activity, summaries, generated files, and downloads.

Runs are serialized and time out after 30 minutes. Inputs and frameworks are copied into `.qa-runs/<id>/workspace`; stale build/test output and symbolic links are excluded. Cancellation and shutdown terminate the active process tree. Agent completion is not proof that tests or quality gates passed: review recorded artifacts and execution evidence. Agent progress is based only on explicit `QA_PROGRESS` events.

Codex receives the same canonical patterns and agent markdown instructions. Where independent delegation is unavailable, the prompt permits sequential specialist work with disclosure. Codex's final response is retained in `summary.md`. Missing authentication, account capacity, document tooling, Jira tools, or service configuration can block individual stages.

## Direct BDD execution

Configure the source framework's `appsettings.json` and `Input/TestData.json` with real endpoints, credentials, and test data before running. Missing/invalid files, unresolved `REPLACE_WITH_` values, and missing SDKs are reported as blocked. The C# runner executes an isolated framework copy:

```sh
dotnet --list-sdks
dotnet restore AutomationFramework.csproj
dotnet build AutomationFramework.csproj --no-restore -c Release
dotnet test AutomationFramework.csproj --no-build --no-restore -c Release --logger 'trx;LogFilePrefix=bdd' --results-directory <run-results-directory>
```

Release or Debug and an optional VSTest filter are supported. The filter is passed as one literal argument. A standalone `.feature` file needs bindings and a generated test project. Jobs publish TRX, a bounded execution log, a Markdown summary, and an HTML report generated in C#. No executed TRX tests means blocked, even if the command exited successfully. Direct execution uses zero AI tokens and does not claim agent review.

The optional agent-based RunForge workflow still depends on its configured tooling. If `scripts/TestExecution-AllureReporter.ps1` is missing, the agent must report that limitation; the direct C# report does not depend on that script.

## Dashboard evidence and costs

Select one TRX report/attempt; reports are never added together as distinct cases. The native C# parser supports XML namespaces, final outcomes across retries, failure details and stack traces, durations, and defined-but-unexecuted tests. Invalid reports display warnings. DTDs/entities are rejected. Without TRX evidence, plain Gherkin scenarios are listed as having no recorded execution; Scenario Outline examples are not guessed.

Session token totals come from Copilot `usage.json` when available. Cache tokens are included in input totals and reasoning is included in output totals; neither is counted twice. Codex usage remains unavailable unless recorded in the supported usage format. Direct .NET execution reports zero tokens. User-entered USD rates persist in the browser and produce estimates, not billed charges. Unknown rates or usage are not invented. Dashboard metrics can be exported as JSON.

## Jira and local execution

Configure a usable Jira command/arguments/environment or URL in `.vscode/mcp.json`. The C# application converts its `servers` map into Copilot's `mcpServers` configuration and passes credentials only to the runner. `${input:...}` substitutions are not resolved. Codex uses its own configured tools; Copilot MCP settings are not automatically translated to Codex. No Jira writes are requested.

This is a trusted-user local tool with loopback hosting, host/origin checks, and protected workspace paths. Only `wwwroot` is publicly served; run artifacts are allowlisted and symbolic links are rejected. Selected runners can execute commands and access configured services under their own permissions. Run folders separate output but are not operating-system sandboxes. Do not expose this local tool publicly without authentication, process isolation, and a managed job queue.
