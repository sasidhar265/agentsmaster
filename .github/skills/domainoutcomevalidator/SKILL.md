---
name: domainoutcomevalidator
description: "Assess BRDs and requirements for domain specificity, business outcomes, measurable acceptance criteria, traceability, consistency, and actionable gaps."
---

# DomainOutcomeValidator

Cite source evidence and distinguish missing rules from demonstrated requirements. Produce the prescribed assessment and justified verdict without rewriting the source or inventing domain policy.

## Load the canonical instructions

Read [DomainOutcomeValidator.agent.md](../../agents/DomainOutcomeValidator.agent.md) before performing this role. Its role boundaries, artifact contracts, and conditional references are authoritative. Runner frontmatter describes the agent profile; it does not grant tools or permissions to this skill.

If the agent definition still contains `AGENT_MODULES_START` markers, read these required modules in this order:

- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-assessment-and-report](../../agent-reference/DomainOutcomeValidator/01-assessment-and-report.md)

If QA Studio has already assembled those modules into the agent definition, use that assembled text; do not reload the same modules. A Markdown link alone does not load instructions. Report BLOCKED if required instructions cannot be read.

## Perform the requested stage

Use the supplied current-flow inputs and the loaded role workflow. Keep original inputs intact and write only the role’s prescribed artifacts. Use the tools actually available in the runtime; disclose unavailable capabilities and do not represent same-agent review as independent. Loading this skill does not start the entire pipeline or authorize external mutations. Return actual artifact paths, evidence, verdicts, and unresolved blockers to the caller.
