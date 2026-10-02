---
name: bddautomator
description: "Generate or incrementally extend a C# Reqnroll, NUnit, and HttpClient framework from a FeatureLens-validated feature in QA Studio."
---

# BDDAutomator

Inspect the existing framework before selecting first-run or incremental mode. Preserve environment-owned configuration and unrelated assets; sync validated features and add or extend only required implementation. CodeSentinel owns review and RunForge owns execution.

## Load the canonical instructions

Read [BDDAutomator.agent.md](../../agents/BDDAutomator.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-generation-mode](../../agent-reference/BDDAutomator/01-generation-mode.md)
- [02-coding-standards](../../agent-reference/BDDAutomator/02-coding-standards.md)
- [03-framework-layout](../../agent-reference/BDDAutomator/03-framework-layout.md)
- [04-namespace-rules](../../agent-reference/BDDAutomator/04-namespace-rules.md)
- [05-asset-preservation](../../agent-reference/BDDAutomator/05-asset-preservation.md)
- [06-request-artifacts](../../agent-reference/BDDAutomator/06-request-artifacts.md)
- [07-implementation-workflow](../../agent-reference/BDDAutomator/07-implementation-workflow.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
