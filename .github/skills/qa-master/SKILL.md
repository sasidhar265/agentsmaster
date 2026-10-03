---
name: qa-master
description: "Coordinate QA Studio canonical testing patterns, specialist handoffs, quality gates, and bounded rework; use for a complete or multi-stage QA request."
---

# Route workflows and enforce quality gates

## Plan the selected route

Inputs: requested pattern or testing intent, current-flow requirement paths, BASE_NAME, available runtime capabilities, and any existing framework or validation reports.

Resolve Patterns 0–12 from the routing reference. Preserve an explicit pattern. Ask for the pattern only when intent remains ambiguous. Resolve Jira inputs before dependent analysis and run SpecForge once per flow. For Patterns 4/8, maintain separate manual and automation tracks; framework generation and export wait for both upstream review gates.

## Delegate and enforce gates

Give each specialist exact input/output paths, BASE_NAME, relevant prior verdicts, and a short stage request. Load only the selected specialist's skill at that stage. Use delegation when supported; disclose sequential fallback and do not claim independent review in that case. Emit actual QA_PROGRESS lifecycle events.

Inspect each returned artifact's existence, current-flow identity, gate evidence, and blockers. A completion event is not a passing verdict. On failure, return the exact rule, location, evidence, and cycle number to the owning generator. Re-run affected reviews, preserve successful unrelated work, and stop dependent stages after three failed rework cycles.

## Close the workflow

Return the actual sequence, artifact paths, measured gates, rework counts, and unresolved blockers. Do not create an extra orchestration report in output/. Pattern 10 reviews and executes an existing framework without regeneration; Pattern 12 ends after BRD assessment.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-execution-and-routing](../../agent-reference/QA-Master/01-execution-and-routing.md)
- [02-inputs-and-fast-mode](../../agent-reference/QA-Master/02-inputs-and-fast-mode.md)
- [03-gates-and-artifacts](../../agent-reference/QA-Master/03-gates-and-artifacts.md)
<!-- AGENT_MODULES_END -->
