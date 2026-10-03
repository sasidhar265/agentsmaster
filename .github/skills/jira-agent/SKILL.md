---
name: jira-agent
description: "Extract Jira requirements, issue hierarchy, and raw attachments within a requested epic or query, using available authenticated tools and preserving a flat attachment-only output."
---

# Extract Jira requirements and attachments

## Resolve access and requested scope

Inputs: epic/issue/project key or explicit JQL, current-flow output path, and configured Jira access. Select one working MCP or configured terminal method. Discover actual custom fields when required and paginate issue relationships/comments. A single-epic request never expands to the project.

## Extract complete requirements and attachments

Fetch source requirement fields, comments, parent/child and requested linked-test relationships. Keep hierarchy and metadata in the handoff. Download returned attachment content as binary to output/jira/{EPIC_KEY}-{original filename}; disambiguate duplicates by owning issue key and sanitize filenames. Preserve bytes, report files over 50 MB as skipped, and never overwrite different attachments.

Reuse the canonical Jira-AttachmentDownloader.ps1 and Docx-TextExtractor.ps1 where available. Honor retry delays and retry only failed downloads, preserving successful files. Missing access or required content is BLOCKED; no Jira mutations are authorized by extraction.

## Verify the downstream handoff

Verify each claimed download exists and report actual issue/attachment counts, exact paths, epic BASE_NAME, hierarchy, non-attachment requirement content, and partial failures. Keep output/jira/ flat and raw-attachment-only: no issue JSON, metadata, text copies, manifests, or reports. The configured role name is jira-agent; orchestration progress uses JiraExtractor.

## Required standards and artifact contracts

Read these references in order before executing this procedure. They own detailed constraints, rubrics, and formats; this skill owns the stage procedure. When this skill and these references are already inline in a compiled agent, use that text without reloading it. Missing required references are BLOCKED.

<!-- AGENT_MODULES_START -->
- [GENAI-QUALITY](../../agent-reference/GENAI-QUALITY.md)
- [01-extraction-workflow](../../agent-reference/jira/01-extraction-workflow.md)
<!-- AGENT_MODULES_END -->
