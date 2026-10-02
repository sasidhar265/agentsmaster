---
description: "SUPERSEDED — do not invoke. The framework-wiring role (services, builders, models, utilities, hooks, scaffolding) is now owned end-to-end by BDDAutomator; code review is owned by CodeSentinel and execution/reporting by RunForge."
name: "AutomationForge"
tools: [read]
user-invocable: false
---

# AutomationForge — SUPERSEDED

This agent is retired. Its responsibilities were merged into the current pipeline:

| Former responsibility | Now owned by |
|---|---|
| Services, Builders, Models, Utilities, Hooks, TestContext, project scaffolding, wiring step bodies | **BDDAutomator** (builds the framework on the first run, then updates it incrementally) |
| Standards / quality review of the generated code | **CodeSentinel** |
| Build, test execution, HTML reporting | **RunForge** |

Its RestSharp-based guidance is obsolete: the framework standard is **HttpClient only** (RestSharp is banned).

**Do not invoke AutomationForge.** QA-Master routes automation work to BDDAutomator → CodeSentinel → RunForge.
