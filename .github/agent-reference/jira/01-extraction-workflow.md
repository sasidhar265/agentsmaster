## Inputs and scope

Use the requested project/epic/issue key or explicit JQL and caller's output path. Support epic extraction with child stories/test cases/scenarios, project-wide epic extraction, label/recent-update queries, custom requirement fields and linked-issue traceability. Preserve hierarchy in memory/response, not filesystem folders. Never expand a single-epic request to the whole project.

## Canonical output (overrides all reference examples)

- One flat folder: `./output/jira/`, raw downloaded attachments ONLY.
- `BASE_NAME` is the Jira epic key, not an attachment name. Save `{BASE_NAME}-{original filename}`. Every downstream specialist uses that same BASE_NAME.
- Disambiguate same-epic duplicate filenames with the owning issue key, e.g. `GQS-1-GQS-2_Acceptance Criteria.docx`; prevent overwriting different attachments. Sanitize path separators/unsafe filename characters.
- No epic/story subfolders, issue JSON, description.txt, extracted text copies, manifests, metadata files or reports in this folder. Keep metadata and extracted requirement text in memory/response for the downstream handoff.
- Do not mix or reuse attachments from another flow. Preserve downloaded bytes and verify each reported file exists; report partial failures and skipped attachments.

## Execution

1. Resolve the available access method once. Prefer a working configured MCP tool or existing canonical downloader; do not repeatedly probe unrelated tool aliases. Never assume a tool exists merely because an example names it.
2. Fetch complete issue requirements: summary/description, type/status/priority/labels, acceptance criteria/business rules/custom fields, comments, attachment metadata, parent/child and linked-issue relationships. Use full fields when required and paginate results/comments so no required source is silently dropped.
3. Find child stories with project-appropriate JQL (e.g. `"Epic Link" = KEY OR parent = KEY`). Fetch their full requirements and attachments, and requested linked tests/scenarios. Preserve issue-key/source traceability. Query only the requested scope.
4. Fetch each attachment from its returned content URL using authenticated binary download. Support Word, PDF, spreadsheets, JSON/XML, diagrams and other attached requirement formats. Skip files >50 MB and explicitly report them; a skipped document is not a successful extraction.
5. Pass QA-Master the epic BASE_NAME, exact saved paths, requirement content not contained in attachments, parent/child mapping, counts and remaining blockers. Do not dump whole raw JSON/API responses when a concise structured handoff suffices. Do not claim a download succeeded without its saved file.

## Access and helper reuse

- MCP capabilities include search/JQL, get-issue, download/fetch attachment, field discovery and project listing. Use runtime-exposed schemas; discover custom acceptance-criteria/business-rule fields when necessary.
- Terminal access uses configured `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` from environment/workspace configuration. Existing setups may use JSON `.env` or key=value format; respect the actual configured loader. Do not print tokens, auth headers or credential-bearing responses. Missing credentials/access are BLOCKED, never fabricated.
- Check `./scripts/Jira-AttachmentDownloader.ps1` before generating download code. Source/reuse it with current-flow parameters if present; verify its output follows the flat-folder contract. If missing and needed, create it once with generic parameters; fixes edit this same file in place. No inline duplicates, `-v2` copies, scattered helpers, or deletion after use.
- PowerShell: 5.1+ on Windows or Core on macOS/Linux. For Basic-auth construction use UTF-8 and delimit interpolated variables before `:`. Preserve supported Cloud/Server authentication behavior; use the deployment's configured APIs.
- Keep full attachments on disk; extract the relevant document content once for this flow for downstream analysis. Reuse `./scripts/Docx-TextExtractor.ps1` where available.

## On-demand reference

`.github/agent-reference/jira-setup-and-examples.md` retains setup, MCP configuration, JQL/tool-call examples and the PowerShell helper implementation. Locate/read only a relevant heading when required:
- First setup or missing configuration: `QUICK START - Setup Guide for New Users`, `MCP Tool Configuration`, `Environment Variable Setup`.
- Missing downloader: `PowerShell File Saving Helper Functions`; adapt legacy helper output to the canonical contract above before executing.
- Unfamiliar operation: `Requirement Extraction Operations` or `Complete Epic Extraction Workflow`.
- Access/download failure: `Error Handling for Requirement Extraction`.

Do not rerun setup tutorials or read implementation examples during a working extraction. Reference examples do not authorize Jira mutations, software installs or changed output formats.

## Error handling

- Authentication failure: report invalid/missing credentials, without exposing them. Permission denied: identify the issue/attachment requiring access. Not found: verify the supplied key; do not guess another epic.
- Invalid JQL: inspect syntax and configured field names. Missing MCP tools: use a working configured terminal method if available, otherwise report the unavailable capability.
- Rate limits: honor the returned retry delay and paginate/reduce batches. Download timeouts: retry the failed attachment with an appropriate timeout or smaller batch; preserve completed downloads, do not restart extraction.
- Download/write/unsupported-size errors: report exact affected issue/filename and reason. Stop dependent work if required requirements are unavailable. Do not fabricate a complete extraction.
- Respond with actual extracted counts, saved paths and actionable failures. Do not publish Jira changes.
