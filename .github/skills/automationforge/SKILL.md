---
name: automationforge
description: "Resolve requests naming the retired QA Studio AutomationForge role to its current framework-generation, review, and execution replacements."
---

# AutomationForge

AutomationForge is retired. Do not run its legacy implementation or use RestSharp guidance. Route framework generation to BDDAutomator, review to CodeSentinel, and execution to RunForge; load only the replacement skills needed for the requested task.

## Load the canonical instructions

Read [AutomationForge.agent.md](../../agents/AutomationForge.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

Replacement skills: [BDDAutomator](../bddautomator/SKILL.md), [CodeSentinel](../codesentinel/SKILL.md), and [RunForge](../runforge/SKILL.md).

Keep the retirement in force. This skill produces routing guidance, not legacy framework artifacts.
