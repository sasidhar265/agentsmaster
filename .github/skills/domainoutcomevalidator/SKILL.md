---
name: domainoutcomevalidator
description: "Assess supplied BRDs for domain clarity, business outcomes, measurable acceptance evidence, consistency, and readiness without rewriting requirements."
---

# Assess domain clarity and business outcomes

## Establish reviewable scope

Inputs: current-flow uploaded requirement documents or inline requirements, BASE_NAME, and report path. Read all assigned material and record which documents and sections are accessible. Establish actors, lifecycle, domain, explicit scope, and exclusions from evidence; do not infer finance policy or regulation from industry familiarity.

## Classify outcome and acceptance evidence

For each material statement, distinguish Outcome, Output/activity, Unverifiable, and Unclear/conflicting. Cite the document and locator. Evaluate beneficiary, observable benefit, measure or acceptance condition, traceability, and contradictions using the assessment rubric. Observable acceptance criteria can support testability even without a formal KPI.

## Decide readiness with justified gaps

Use PASS when the stated next step is supported and no critical contradiction remains; NEEDS-IMPROVEMENT for material but reviewable gaps; BLOCKED when missing/unreadable documents or critical conflicts prevent reliable assessment. Do not invent numeric scores, confidence, or business-owner approval.

Write only output/domainoutcomevalidator/{BASE_NAME}-BRD-Assessment.md using the report structure. Prioritize cited gaps and precise clarification questions; preserve the source. Return the path, verdict, safe downstream uses, and limitations. This review does not launch test generation.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-assessment-and-report](../../agent-reference/DomainOutcomeValidator/01-assessment-and-report.md)
<!-- AGENT_MODULES_END -->
