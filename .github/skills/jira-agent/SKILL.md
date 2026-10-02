---
name: jira-agent
description: "Extract requirements and raw attachments from the requested Jira epic or query for QA Studio, preserving issue traceability and reporting partial access or download failures."
---

# JiraExtractor

The configured agent is jira-agent; QA-Master reports its lifecycle as JiraExtractor. Preserve the flat output/jira/ attachment-only contract and epic BASE_NAME. Stay within the requested extraction scope and do not mutate Jira.

## Load the canonical instructions

Read [jira.agent.md](../../agents/jira.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
