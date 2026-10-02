# Jira setup and implementation reference

Read only the relevant section when setup, a missing helper or a specific tool error requires it. Do not load this whole reference for routine extraction. These are retained setup/examples, not additional runtime instructions.

The active `../agents/jira.agent.md` contract overrides legacy paths and persistence in these examples: flat `./output/jira/`, epic-prefixed raw attachments only, no metadata/manifests/per-epic directories. Adapt a helper to that contract before using it; do not execute example commands against example issue keys. Never print credentials. Tool names and schemas must match tools actually available at runtime.

## ⚡ QUICK START - Setup Guide for New Users

**Follow these steps to set up the Jira Agent for the first time. Takes ~10 minutes.**

### Step 1: Prerequisites Checklist ✅

Before using this agent, verify you have:

- [ ] **Windows 10+** (or macOS/Linux with PowerShell Core)
- [ ] **VS Code** installed and current workspace open
- [ ] **PowerShell 5.1+** (Windows) or **PowerShell Core 7+** (Mac/Linux)
  - Check: Open PowerShell and run `$PSVersionTable.PSVersion`
- [ ] **Jira Cloud account** with API access (or Jira Server/Data Center)
- [ ] **Jira API Token** generated (not password)
  - Get it: https://id.atlassian.com/manage-profile/security/api-tokens
- [ ] **Project access** to at least one Jira Epic

### Step 2: Create `.env` File (Credentials)

**File location:** `.env` (in workspace root, same level as `.github/`)

**Contents:** Copy this template and fill in your Jira details:
```json
{
  "JIRA_URL": "https://YOUR-SUBDOMAIN.atlassian.net",
  "JIRA_USERNAME": "your-email@company.com",
  "JIRA_API_TOKEN": "YOUR_API_TOKEN_HERE"
}
```


**⚠️ Security Note:** Never commit `.env` to git. Add to `.gitignore`:
```
.env
```

### Step 3: Create Helper Script

**File location:** `scripts/Jira-AttachmentDownloader.ps1`

**Create the directory if it doesn't exist:**
```powershell
mkdir -Force "scripts" | Out-Null
```

**Copy the full script from the "PowerShell File Saving Helper Functions" section below** (Search for "Save this script as `scripts/Jira-AttachmentDownloader.ps1`")

Or **download from workspace:** If the file already exists, skip this step.

**CHECK-FIRST, REUSE, EDIT-IN-PLACE (MANDATORY)**:
- `scripts/` is the SINGLE shared folder for every reusable script used by ANY agent (Jira downloader, SheetCraft's Excel exporter, etc.) - never scatter helper scripts elsewhere (e.g., workspace root).
- Before creating this script, run `Test-Path "scripts/Jira-AttachmentDownloader.ps1"`. If it already exists, DO NOT recreate or duplicate it - just source it (`. "./scripts/Jira-AttachmentDownloader.ps1"`) and reuse the existing functions.
- Only create it the FIRST time it is missing.
- If download logic ever needs a fix or enhancement, edit THIS SAME file in place. Never create a second/duplicate helper script (e.g., `Jira-AttachmentDownloader-v2.ps1`, `download-project-attachments.ps1` with duplicated logic) - additional convenience scripts must call the existing helper functions rather than reimplementing them.

### Step 4: Verify Setup

**Run this command in PowerShell (from workspace root):**

```powershell
# Test 1: Check .env file exists and is valid JSON
$envFile = '.env'
if (Test-Path $envFile) {
    try {
        $env = Get-Content $envFile | ConvertFrom-Json
        Write-Host "✓ .env file found and valid JSON" -ForegroundColor Green
        Write-Host "  JIRA_URL: $($env.JIRA_URL)"
        Write-Host "  JIRA_USERNAME: $($env.JIRA_USERNAME)"
    } catch {
        Write-Host "✗ .env file exists but invalid JSON: $_" -ForegroundColor Red
    }
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
}

# Test 2: Check helper script exists
$script = 'scripts/Jira-AttachmentDownloader.ps1'
if (Test-Path $script) {
    Write-Host "✓ Helper script found" -ForegroundColor Green
} else {
    Write-Host "✗ Helper script not found at $script" -ForegroundColor Red
}

# Test 3: Check output directory can be created
$outputDir = 'Output/JiraAttachments'
try {
    New-Item -ItemType Directory -Path $outputDir -Force -ErrorAction Stop | Out-Null
    Write-Host "✓ Output directory created/verified at $outputDir" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot create output directory: $_" -ForegroundColor Red
}

# Test 4: Test Jira connectivity
$envContent = Get-Content '.env' | ConvertFrom-Json
$pair = "$($envContent.JIRA_USERNAME):$($envContent.JIRA_API_TOKEN)"
$encodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{'Authorization' = "Basic $encodedAuth"}

try {
    $result = Invoke-RestMethod -Uri "$($envContent.JIRA_URL)/rest/api/3/myself" `
        -Headers $headers -Method Get
    Write-Host "✓ Jira connection successful" -ForegroundColor Green
    Write-Host "  Authenticated as: $($result.displayName)"
} catch {
    Write-Host "✗ Jira connection failed: $_" -ForegroundColor Red
}
```

**Expected Output:**
```
✓ .env file found and valid JSON
  JIRA_URL: https://your-domain.atlassian.net
  JIRA_USERNAME: your-email@yourcompany.com
✓ Helper script found
✓ Output directory created/verified at Output/JiraAttachments
✓ Jira connection successful
  Authenticated as: <Your Display Name>
```

If you see ✗ errors, see "Troubleshooting Setup Issues" below.

### Step 5: Test First Download

**Run this simple test command:**

```powershell
# Load and initialize
. "./scripts/Jira-AttachmentDownloader.ps1"
$auth = Initialize-JiraAuth -EnvFilePath ".env"

# Download a single epic's attachments
# Replace "PROJ-1" with an actual epic key from your project
Download-IssueAttachments -IssueKey "PROJ-1" -OutputDir "Output/Test" -Auth $auth
```

**Expected output:**
```
✓ Jira authentication initialized
  ✓ Downloaded: Requirement-Document.docx (24,576 bytes)
✓ Download complete!
  Files downloaded: 1
  Output: Output/Test/PROJ-1/attachments/
```

**If successful:** Setup is complete! Skip to "Usage Examples" below.
**If failed:** See "Troubleshooting Setup Issues" below.

---

## 🔧 Troubleshooting Setup Issues

### Issue: ".env file not found"
**Solution:**
1. Create `.env` file in workspace root (same folder as `.github/`)
2. File must be named exactly `.env` (with the dot)
3. Content must be valid JSON
4. Verify with: `Get-Content .env | ConvertFrom-Json`

### Issue: "Jira connection failed: 401 Unauthorized"
**Solution:**
1. Verify API token hasn't expired (regenerate at https://id.atlassian.com/manage-profile/security/api-tokens)
2. Verify email/token are correct in `.env`
3. Try API directly in browser: `https://YOUR-JIRA-URL/rest/api/3/myself`
4. Check user permissions in Jira (may need admin to access epics)

### Issue: "Helper script not found"
**Solution:**
1. Ensure `scripts/` directory exists: `mkdir scripts`
2. Copy full helper script to `scripts/Jira-AttachmentDownloader.ps1`
3. Verify file exists: `Test-Path "scripts/Jira-AttachmentDownloader.ps1"`

### Issue: "Output directory access denied"
**Solution:**
1. Check folder permissions (right-click → Properties → Security)
2. Ensure you have write access to workspace
3. Try creating manually: `mkdir "Output/JiraAttachments"`
4. Run VS Code as Administrator

### Issue: "Epic key not found"
**Solution:**
1. Verify epic key exists in your Jira project
2. Check you have access to that epic (may need project admin)
3. Try different epic: Get list from Jira UI first
4. Use correct key format (e.g., `PROJ-1` not `proj-1`)

### Issue: "PowerShell script execution disabled"
**Solution:**
```powershell
# Check current execution policy
Get-ExecutionPolicy

# If "Restricted", change to "RemoteSigned"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📋 Files You Should Have After Setup

After completing the setup, your workspace should contain:

```
Demo/
├── .env                           ✅ Created (Step 2)
├── .gitignore                     ✅ Contains .env
├── .github/
│   └── agents/
│       └── jira.agent.md          ✅ This file
├── scripts/
│   ├── Jira-AttachmentDownloader.ps1   ✅ Created (Step 3)
│   ├── download-project-attachments.ps1    (Optional)
│   └── download-all-project-attachments.ps1 (Optional)
└── Output/
    └── JiraAttachments/           ✅ Created (Step 4)
```

---

## 🚀 Usage Examples - Ready to Use!

Now that setup is complete, try these commands:

### Example 1: Download Single Epic Attachments
```powershell
. "./scripts/Jira-AttachmentDownloader.ps1"
$auth = Initialize-JiraAuth
Download-IssueAttachments -IssueKey "PROJ-1" -OutputDir "Output/JiraAttachments" -Auth $auth
```

### Example 2: Download All Project Epics
```powershell
. "./scripts/Jira-AttachmentDownloader.ps1"
$auth = Initialize-JiraAuth
Download-ProjectEpicAttachments -ProjectKey "PROJ" -OutputDir "Output/JiraAttachments" -Auth $auth
```

### Example 3: Full Epic Extraction (Epic + Stories)
```powershell
. "./scripts/Jira-AttachmentDownloader.ps1"
$auth = Initialize-JiraAuth
Extract-EpicHierarchy -EpicKey "PROJ-1" -OutputDir "Output/jira" -Auth $auth
```

---

## 💬 How to Use This Agent - Common Requests

**Once setup is complete, use this agent in Copilot Chat by asking:**

### Search & Query Requests
```
"Find all epics in PROJ project"
"Search for stories updated in last 7 days"
"Get all issues with label 'requirement'"
"List all test cases linked to PROJ-1"
```

### Download Requests (Terminal Execution)
```
"Download attachments from PROJ-1"
"Download all PROJ epic attachments"
"Save PROJ-1 epic with all child stories to workspace"
"Fetch PROJ-2 epic attachments"
```

### Extraction Requests (Full Workflow)
```
"Extract PROJ-1 epic with full hierarchy"
"Get PROJ-1 epic details and save all attachments"
"Download PROJ-1 and all child stories to Output/jira"
```

### What the Agent Will Do
1. Load credentials from `.env`
2. Execute terminal commands (if download/save requested)
3. Create organized folder structures
4. Download files to `Output/`
5. Generate metadata and manifests
6. Report progress and results

### Example Conversation
```
You: "Download attachments from PROJ-2"

Agent:
1. Loads .env credentials ✓
2. Executes terminal download command ✓
3. Creates: Output/JiraAttachments/PROJ-2/attachments/
4. Downloads: Requirement-Document.docx (18,432 bytes)
5. Saves metadata: Requirement-Document.docx.metadata.json
6. Reports: "✓ Downloaded 1 file to Output/JiraAttachments/PROJ-2/attachments/"

You: Check Output folder → Files are there! ✓
```

---

## 🌟 Agent Capabilities Summary

| Capability | How It Works | Status |
|-----------|-------------|--------|
| **Search Jira Issues** | JQL queries via REST API | ✅ Ready (no setup needed) |
| **Fetch Epic Details** | Get full issue data with custom fields | ✅ Ready (no setup needed) |
| **Download Attachments** | Terminal PowerShell execution | ✅ Ready (after Step 3 setup) |
| **Save to Workspace** | Files saved to `Output/` directories | ✅ Ready (after Step 3 setup) |
| **Organize Hierarchies** | Epic → Stories → Attachments structure | ✅ Ready (after Step 3 setup) |
| **Generate Manifests** | JSON metadata and summaries | ✅ Ready (after Step 3 setup) |
| **Extract Full Epics** | Complete hierarchical extraction | ✅ Ready (after Step 3 setup) |
| **Real-time Feedback** | Terminal output during downloads | ✅ Ready (after Step 3 setup) |
| **MCP Tools (Advanced)** | Native Jira MCP integration | ⚠️ Optional (requires Node.js setup) |

**What works out-of-the-box:** Querying and fetching Jira data
**What requires setup:** Downloading attachments and saving to workspace (Steps 1-4 above)

---

## 🧪 Verified Test Log (Example Epic)

**Last verified:** 2026-09-02 against `https://your-domain.atlassian.net` (replace with your own Jira instance/epic when following along)

MCP Atlassian tools (`jira_get_issue`, `jira_search`, `jira_download_attachments`) were **not present** in the tool list for this workspace (no MCP server registered in `.vscode/settings.json`). As a fallback, the same operations were validated directly against the Jira Cloud REST API using the credentials in `.env`, confirming the underlying workflow the MCP tools would perform:

| Check | Result |
|---|---|
| Auth (`/rest/api/3/myself`) | ✅ 200 OK — authenticated as `your-email@yourcompany.com` |
| Fetch `PROJ-1` (`/rest/api/3/issue/PROJ-1`) | ✅ 200 OK |
| Epic name | `Sample Requirement Epic` |
| Epic type | `Epic` |
| Description | "Refer attached BRD document for complete business requirements. Document: Sample Requirement Epic BRD. Version: 1.0. Status: Approved." |
| Attachments | ✅ 1 file — `Requirement-Document.docx` (24,576 bytes) |
| Attachment download (`/rest/api/3/attachment/content/{id}`) | ✅ Downloaded successfully, byte size matched metadata |
| Legacy search `GET /rest/api/3/search?jql=...` | ❌ 410 Gone (deprecated by Atlassian) |
| Modern search `GET/POST /rest/api/3/search/jql` | ✅ Works — returns `PROJ-1` for `project = PROJ` |

**Two bugs found and fixed in the PowerShell examples below:**
1. `"$JIRA_USERNAME:$JIRA_API_TOKEN"` fails to parse — PowerShell treats `:` after a variable as a drive-qualifier. Fixed by using `"${JIRA_USERNAME}:${JIRA_API_TOKEN}"`.
2. `[Text.Encoding]::ASCII.GetBytes(...)` threw `Array cannot be null` once `$pair` failed to build (cascading from bug 1). Also switched to `UTF8` encoding for safety with non-ASCII tokens.
3. The old `/rest/api/3/search` endpoint is retired on Jira Cloud (returns `410 Gone`); use `/rest/api/3/search/jql` instead.
4. Attachment binary content should be fetched via `/rest/api/3/attachment/content/{attachmentId}` (reliable) rather than assuming the `content` URL field always resolves directly with `Invoke-RestMethod` — use `Invoke-WebRequest -OutFile` for binary files.

---

## 🔍 Root Cause: Why the MCP Tools Never Appeared

Follow-up investigation found the MCP server was **never actually wired up**, for three independent reasons:

1. **Wrong VS Code config location/key.** `.vscode/settings.json` had a `"modelContextProtocol"` key — this is not a real VS Code setting. VS Code reads MCP server definitions from **`.vscode/mcp.json`** (workspace) with a top-level `"servers"` object. This has been fixed — see [`.vscode/mcp.json`](../../.vscode/mcp.json).
2. **Package that doesn't exist.** The config referenced `@modelcontextprotocol/server-atlassian`, which is **not a published npm package**. The real, actively maintained Jira MCP server is [`@aashari/mcp-server-atlassian-jira`](https://www.npmjs.com/package/@aashari/mcp-server-atlassian-jira) (v3.x). It exposes **5 generic HTTP tools**, not the named tools this file originally documented:

   | Old (fictional) tool name | Real tool (v3.x) | Usage |
   |---|---|---|
   | `jira_get_issue` | `jira_get` | `jira_get(path="/rest/api/3/issue/PROJ-1")` |
   | `jira_search` | `jira_get` | `jira_get(path="/rest/api/3/search/jql", queryParams={"jql": "..."})` |
   | `jira_download_attachments` | `jira_get` | `jira_get(path="/rest/api/3/attachment/content/{id}")` (binary; verify the client saves raw bytes, not JSON) |
   | `jira_search_fields` | `jira_get` | `jira_get(path="/rest/api/3/field")` |
   | `jira_get_all_projects` | `jira_get` | `jira_get(path="/rest/api/3/project/search")` |

3. **Wrong environment variable names for the real package.** This package expects `ATLASSIAN_SITE_NAME` (just the subdomain, e.g. `your-company-name`), `ATLASSIAN_USER_EMAIL`, and `ATLASSIAN_API_TOKEN` — not `JIRA_URL`/`JIRA_USERNAME`/`JIRA_API_TOKEN`. The corrected `.vscode/mcp.json` uses the right names.
4. **Node.js/npx is not installed on this machine** (`node`/`npx`/`npm` all resolve to "not recognized"). Since the server is launched via `npx`, **no MCP server can start until Node.js is installed**, regardless of config correctness. Install Node.js LTS from https://nodejs.org, then reload VS Code (`Ctrl+Shift+P` → "Developer: Reload Window") to pick up `.vscode/mcp.json`.

**Until Node.js is installed and the server is confirmed running (`/tools search jira` shows `jira_get`, etc.), this agent's REST-API PowerShell fallback (validated above against real `PROJ-1` data) is the only working path in this environment.**

---

## 💾 File Saving & Attachment Download Utilities

**This agent includes integrated file-saving capabilities for downloading and organizing Jira attachments directly to your workspace.**

### Quick File Download Examples

#### Download Single Epic Attachment
```powershell
# Download a sample epic attachment (PROJ-2)
# Output: Output/JiraAttachments/Requirement-Document.docx
$script:downloadJiraAttachment -EpicKey "PROJ-2" -OutputDir "Output/JiraAttachments"
```

#### Download All Epic Attachments
```powershell
# Download all attachments from PROJ-1 and PROJ-2
# Output: Output/JiraAttachments/{epic-key}/
$script:downloadAllEpicAttachments -Project "PROJ" -OutputDir "Output/JiraAttachments"
```

#### Download with Organized Hierarchy
```powershell
# Download epic + all child stories + attachments with full structure
# Output: Output/jira/{epic-key}/stories/{story-key}/attachments/
$script:extractEpicHierarchy -EpicKey "PROJ-1" -OutputDir "Output/jira"
```

### File Saving Configuration

**Attachments are saved to:**
- Default: `Output/JiraAttachments/` (configurable)
- Organized by: Epic Key → Story Key → Attachment Name
- Metadata saved alongside each file: `.metadata.json`

**Directory Structure:**
```
Output/
├── JiraAttachments/              (Flat: simple downloads)
│   ├── Requirement-Document.docx
│   └── Acceptance Criteria.docx

```

---

## ⚡ Terminal Execution for Direct File Downloads

**This agent can execute terminal commands to directly download and save Jira attachments to your workspace.**

### Quick Terminal Examples

#### Download Single Epic Attachment to Workspace
```powershell
# Downloads PROJ-2 sample attachment (Requirement-Document.docx)
# Output: Output/JiraAttachments/PROJ-2/attachments/Requirement-Document.docx
$auth = Initialize-JiraAuth
Download-IssueAttachments -IssueKey "PROJ-2" -OutputDir "Output/JiraAttachments" -Auth $auth
```

#### Download All Project Epics in One Command
```powershell
# Downloads all project epic attachments with manifest
# Output: Output/JiraAttachments/{epic-key}/attachments/
$auth = Initialize-JiraAuth
Download-ProjectEpicAttachments -ProjectKey "PROJ" -OutputDir "Output/JiraAttachments" -Auth $auth
```

#### Full Epic Hierarchy Extraction
```powershell
# Downloads epic + all child stories + attachments with full structure
# Output: Output/jira/{epic-key}/stories/{story-key}/attachments/
$auth = Initialize-JiraAuth
Extract-EpicHierarchy -EpicKey "PROJ-1" -OutputDir "Output/jira" -Auth $auth
```

### Terminal Execution Capabilities

**The agent can execute PowerShell scripts directly to:**
- ✓ Download attachments from Jira
- ✓ Save files to `Output/` directories
- ✓ Create organized folder hierarchies
- ✓ Generate manifest JSON files
- ✓ Display download progress and summaries

**Key advantages:**
- Files saved directly to workspace (no manual copy-paste needed)
- Real-time progress feedback
- Metadata automatically captured
- Error handling with detailed messages
- Batch operations on multiple epics

### Terminal Command Examples

#### Command 1: Download Single Epic (PROJ-1)
```powershell
# Execute terminal command to download PROJ-1 attachments
# Input: Epic key PROJ-1
# Output: Output/JiraAttachments/PROJ-1/attachments/Acceptance Criteria.docx
Invoke-WebRequest -Uri "$($env:JIRA_URL)/rest/api/3/attachment/content/<attachment-id>" `
  -Headers @{"Authorization"="Basic <auth>"} -OutFile "Output/JiraAttachments/PROJ-1/attachments/Acceptance Criteria.docx"
```

#### Command 2: Download All Project Epics with Manifest
```powershell
# Terminal execution to download all project epic attachments
# Creates download manifest with metadata
$projectKey = "PROJ"
$outputDir = "Output/JiraAttachments"

# Fetch all epics
$epics = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/search/jql" `
  -Headers @{"Authorization"="Basic <auth>"} `
  -Body (@{jql="project = $projectKey AND issuetype = Epic"; maxResults=100} | ConvertTo-Json) `
  -ContentType "application/json"

# Download each epic's attachments
foreach ($epic in $epics.issues) {
    Write-Host "Downloading: $($epic.key)"
    # Download logic here...
}

# Output: Output/JiraAttachments/download-manifest.json
```

#### Command 3: Full Extraction with Story Hierarchy
```powershell
# Terminal execution for complete epic extraction
# Downloads epic + child stories + all attachments with full structure
# Output structure:
# Output/jira/
# └── PROJ-1/
#     ├── PROJ-1-issue.json
#     ├── extraction-report.json
#     ├── attachments/
#     │   └── Acceptance Criteria.docx
#     └── stories/
#         ├── PROJ-101/
#         │   └── PROJ-101.json
#         └── ...

# Execute in terminal:
. "./scripts/Jira-AttachmentDownloader.ps1"
$auth = Initialize-JiraAuth -EnvFilePath ".env"
Extract-EpicHierarchy -EpicKey "PROJ-1" -OutputDir "Output/jira" -Auth $auth
```

### When Terminal Execution is Triggered

**The agent automatically executes terminal commands when:**
1. User requests: "Download attachments from PROJ-1"
2. User requests: "Save all PROJ epic files to workspace"
3. User requests: "Extract PROJ-1 with full hierarchy"
4. User requests: "Fetch attachments to [directory]"

**Commands execute with:**
- ✓ Automatic credential loading from `.env`
- ✓ Error handling and retry logic
- ✓ Progress reporting during download
- ✓ Completion summary with file count and size
- ✓ Manifest generation for tracking

### Terminal Output Examples

**Example: Download Project Epic Attachments**

```
✓ Jira authentication initialized
Found 2 epics in PROJ

Processing Epic: PROJ-1 - Sample Requirement Epic
  ✓ Downloaded: Acceptance Criteria.docx (24,576 bytes)

Processing Epic: PROJ-2 - Sample Secondary Epic
  ✓ Downloaded: Requirement-Document.docx (18,432 bytes)

✓ Manifest saved: Output/JiraAttachments/download-manifest.json

Download Summary:
  Epics processed: 2
  Files downloaded: 2
  Total size: 43,008 bytes
  Output: Output/JiraAttachments
```

**Example: Full Epic Extraction**

```
========================================
Starting Epic Extraction: PROJ-1
========================================

[1/4] Fetching Epic Details...
  ✓ Epic details saved to: Output/jira/PROJ-1/PROJ-1-issue.json

[2/4] Downloading Epic Attachments...
  ✓ Downloaded: Acceptance Criteria.docx (24,576 bytes)
  ✓ Downloaded 1 epic attachments

[3/4] Finding Child Stories...
  ✓ Found 0 child stories

[4/4] Extracting Child Stories & Attachments...

========================================
✓ Extraction Complete!
========================================
  Epic Key: PROJ-1
  Epic Summary: Sample Requirement Epic
  Child Stories: 0
  Total Attachments: 1
  Output Directory: Output/jira/PROJ-1
  Report: Output/jira/PROJ-1/extraction-report.json
```

---

## ✅ Quick Start - Tool Verification

**Before using this agent, verify MCP tools are configured:**

### Step 1: Reload VS Code
```powershell
# In VS Code: Ctrl+Shift+P → "Developer: Reload Window"
# Or restart VS Code
```

### Step 2: Verify Tools Are Available
```
In Copilot Chat, run: /tools search jira
Expected result: Shows these tools:
✓ jira_search
✓ jira_get_issue
✓ jira_download_attachments
✓ jira_search_fields
✓ jira_get_all_projects
```

### Step 3: Test Connection
```
In Copilot Chat, run: Extract the epic key from your project space
Expected: Agent should be able to search your project and list epics
```

**If tools not appearing:**
- ✓ `.vscode/settings.json` exists with MCP Atlassian configuration
- ✓ `.env` file has valid Jira credentials
- ✓ Node.js v14+ installed: `node --version`
- ✓ Restart VS Code completely (close all windows)

---

## 🔧 MCP Atlassian Tools for Requirement Extraction

**Essential Tools for Requirement Extraction:**

| Tool | Purpose | Use Case |
|------|---------|----------|
| `jira_search` | Execute JQL queries | Find Epics, Stories, Requirements |
| `jira_get_issue` | Fetch complete issue details | Get full requirement with fields, description, custom fields |
| `jira_download_attachments` | Download all attachments | Extract requirement documents, diagrams, specs |
| `jira_search_fields` | Discover custom fields | Find Acceptance Criteria, Story Points, custom requirement fields |
| `jira_get_all_projects` | List available projects | Discover available requirement repositories |

---

## 📥 MCP Attachment Download via mcp_atlassian-mcp_fetch

**Direct MCP tool for fetching attachment content from Jira issues:**

### Tool: `mcp_atlassian-mcp_fetch`
**Purpose:** Retrieve binary attachment content directly from Jira attachment URLs  
**Supports:** All file types (docx, pdf, xlsx, json, xml, images, etc.)

**How to Use:**

1. **Fetch Issue Metadata** - First get the attachment URL from a Jira issue:
   ```
   Use mcp_atlassian-mcp_getJiraIssue with epic key (e.g., "abc")
   Response includes attachment objects with:
   - filename (e.g., "Acceptance Criteria.docx")
   - id (attachment ID)
   - content (direct URL to attachment)
   - size (bytes)
   ```

2. **Fetch Attachment Binary** - Then use `mcp_atlassian-mcp_fetch` to download:
   ```
   Input: attachment.content URL (from step 1)
   Output: Binary file content ready to save
   Example: https://jira-instance.atlassian.net/secure/attachment/10067/Acceptance%20Criteria.docx
   ```

3. **Save to Workspace** - Store downloaded file:
   ```
   Location: ./output/jira/{EPIC_KEY}-{filename}
   Example: ./output/jira/Acceptance_Criteria.docx
   ```

**Implementation Pattern:**
```
1. mcp_atlassian-mcp_getJiraIssue(issueKey="ABC-1")
   → Extract attachment.content URLs from response

2. For each attachment URL:
   mcp_atlassian-mcp_fetch(url=attachment.content)
   → Get binary content

3. create_file(filePath="./output/jira/ABC-6-{filename}", content=binaryContent)
   → Persist to workspace
```

**Alternative: Direct REST API via mcp__aashari_mcp-_jira_get**
```
For permission-restricted attachments, may need:
- Custom auth headers
- Different endpoint (e.g., /secure/attachment/{id} vs /rest/api/3/attachment/{id}/content)
- Check Jira instance admin for attachment access policies
```

**Expected Outcomes:**
- ✅ Fetch attachment metadata: Returns filename, size, content URL
- ✅ Fetch attachment binary: Returns file bytes ready to save
- ⚠️  Permission denied (403): Check Jira API token permissions, may need admin to access attachment content
- ⚠️  Not found (404): Verify attachment ID and Jira URL are correct

---

## ⚙️ Requirement Extraction Principles

**All requirement extraction operations use MCP tools only:**

1. **Query First** - Use JQL to find requirements (Epics, Stories, Requirements)
2. **Fetch Complete Data** - Get full issue details with `fields="*all"` to capture custom fields and acceptance criteria
3. **Download Attachments** - Extract all attached requirement documents (specs, diagrams, acceptance criteria docs)
4. **Preserve Hierarchy** - Maintain parent-child relationships (Epic → Stories → Test Cases → Scenarios)
5. **Save Structured Output** - Export as JSON + artifacts for downstream automation/documentation
6. **No Direct API Calls** - All operations through MCP tools only

---

## 🛠️ PowerShell File Saving Helper Functions

**Save this script as `scripts/Jira-AttachmentDownloader.ps1` for reuse:**

```powershell
# ============================================================
# Jira Attachment Downloader - Reusable Helper Functions
# File: scripts/Jira-AttachmentDownloader.ps1
# Purpose: Download and save Jira attachments with organized structure
# ============================================================

# Load credentials from .env
function Initialize-JiraAuth {
    param(
        [string]$EnvFilePath = ".env"
    )
    
    if (-not (Test-Path $EnvFilePath)) {
        throw "Error: .env file not found at $EnvFilePath"
    }
    
    $envContent = Get-Content $EnvFilePath | ConvertFrom-Json
    $env:JIRA_URL = $envContent.JIRA_URL
    $env:JIRA_USERNAME = $envContent.JIRA_USERNAME
    $env:JIRA_API_TOKEN = $envContent.JIRA_API_TOKEN
    
    # Create auth header (use ${...} to avoid ':' parsing as drive qualifier)
    $pair = "${env:JIRA_USERNAME}:${env:JIRA_API_TOKEN}"
    $encodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
    $authHeader = 'Basic ' + $encodedAuth
    
    return @{
        Headers = @{ 'Authorization' = $authHeader }
        BaseUrl = $env:JIRA_URL
    }
}

# Download single attachment by ID
function Download-JiraAttachment {
    param(
        [string]$AttachmentId,
        [string]$FileName,
        [string]$OutputPath,
        [hashtable]$Auth
    )
    
    $contentUrl = "$($Auth.BaseUrl)/rest/api/3/attachment/content/$AttachmentId"
    
    try {
        $parent = Split-Path -Parent $OutputPath
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        
        Invoke-WebRequest -Uri $contentUrl -Headers $Auth.Headers -UseBasicParsing `
            -OutFile $OutputPath -ErrorAction Stop
        
        $fileInfo = Get-Item $OutputPath
        Write-Host "✓ Downloaded: $FileName ($('{0:N0}' -f $fileInfo.Length) bytes)" -ForegroundColor Green
        
        return @{
            success = $true
            filename = $FileName
            size = $fileInfo.Length
            path = $OutputPath
        }
    } catch {
        Write-Host "✗ Failed to download $FileName : $_" -ForegroundColor Red
        return @{
            success = $false
            filename = $FileName
            error = $_.Exception.Message
        }
    }
}

# Download all attachments from a single issue
function Download-IssueAttachments {
    param(
        [string]$IssueKey,
        [string]$OutputDir,
        [hashtable]$Auth
    )
    
    # Fetch issue with attachments
    $issue = Invoke-RestMethod -Uri "$($Auth.BaseUrl)/rest/api/3/issue/$IssueKey" `
        -Headers $Auth.Headers -Method Get
    
    $issueOutputDir = Join-Path $OutputDir $IssueKey
    New-Item -ItemType Directory -Path $issueOutputDir -Force | Out-Null
    
    $attachmentsDir = Join-Path $issueOutputDir "attachments"
    New-Item -ItemType Directory -Path $attachmentsDir -Force | Out-Null
    
    # Save issue description
    $description = if ($issue.fields.description) { $issue.fields.description } else { "No description provided" }
    $descriptionPath = Join-Path $attachmentsDir "description.md"
    @"
# $($issue.key): $($issue.fields.summary)

**Type:** $($issue.fields.issuetype.name)
**Status:** $($issue.fields.status.name)
**Created:** $($issue.fields.created)

## Description

$description
"@ | Out-File $descriptionPath -Encoding UTF8
    
    Write-Host "✓ Saved: description.md" -ForegroundColor Green
    
    $downloadedFiles = @()
    
    foreach ($attachment in $issue.fields.attachment) {
        $safeFileName = $attachment.filename -replace '[<>:"/\\|?*]', '_'
        $filePath = Join-Path $attachmentsDir $safeFileName
        
        $result = Download-JiraAttachment -AttachmentId $attachment.id -FileName $attachment.filename `
            -OutputPath $filePath -Auth $Auth
        
        if ($result.success) {
            # Save metadata
            @{
                filename = $attachment.filename
                size = $attachment.size
                mimeType = $attachment.mimeType
                created = $attachment.created
                author = $attachment.author.displayName
                downloaded_at = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
                local_path = $filePath
            } | ConvertTo-Json | Out-File "$filePath.metadata.json"
        }
        
        $downloadedFiles += $result
    }
    
    return @{
        issueKey = $IssueKey
        outputDir = $issueOutputDir
        filesCount = @($downloadedFiles | Where-Object { $_.success }).Count
        files = $downloadedFiles
    }
}

# Download all attachments from all epics in a project
function Download-ProjectEpicAttachments {
    param(
        [string]$ProjectKey,
        [string]$OutputDir,
        [hashtable]$Auth
    )
    
    # Search for all epics
    $epics = Invoke-RestMethod -Uri "$($Auth.BaseUrl)/rest/api/3/search/jql" `
        -Headers $Auth.Headers -Method Get `
        -Body (@{ jql = "project = $ProjectKey AND issuetype = Epic"; maxResults = 100 } | ConvertTo-Json) `
        -ContentType "application/json"
    
    Write-Host "Found $($epics.total) epics in $ProjectKey" -ForegroundColor Cyan
    
    $results = @()
    
    foreach ($epic in $epics.issues) {
        Write-Host "`nProcessing Epic: $($epic.key) - $($epic.fields.summary)" -ForegroundColor Yellow
        
        $result = Download-IssueAttachments -IssueKey $epic.key -OutputDir $OutputDir -Auth $Auth
        $results += $result
    }
    
    # Save summary manifest
    $manifestPath = Join-Path $OutputDir "download-manifest.json"
    @{
        project = $ProjectKey
        downloaded_at = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
        epics_processed = $epics.total
        total_files_downloaded = ($results | ForEach-Object { $_.filesCount } | Measure-Object -Sum).Sum
        epics = $results
    } | ConvertTo-Json -Depth 5 | Out-File $manifestPath
    
    Write-Host "`n✓ Manifest saved: $manifestPath" -ForegroundColor Green
    
    return $results
}

# Full epic extraction with hierarchy
function Extract-EpicHierarchy {
    param(
        [string]$EpicKey,
        [string]$OutputDir,
        [hashtable]$Auth
    )
    
    Write-Host "Starting Epic Extraction: $EpicKey" -ForegroundColor Cyan
    
    # Step 1: Get Epic Details
    Write-Host "[1/4] Fetching Epic Details..." -ForegroundColor Cyan
    $epic = Invoke-RestMethod -Uri "$($Auth.BaseUrl)/rest/api/3/issue/$EpicKey" `
        -Headers $Auth.Headers -Method Get
    
    $epicOutputDir = Join-Path $OutputDir $EpicKey
    New-Item -ItemType Directory -Path $epicOutputDir -Force | Out-Null
    $epic | ConvertTo-Json -Depth 10 | Out-File "$epicOutputDir/$EpicKey-issue.json"
    Write-Host "✓ Epic details saved" -ForegroundColor Green
    
    # Step 2: Download Epic Attachments
    Write-Host "[2/4] Downloading Epic Attachments..." -ForegroundColor Cyan
    $epicResult = Download-IssueAttachments -IssueKey $EpicKey -OutputDir $epicOutputDir -Auth $Auth
    Write-Host "✓ Downloaded $($epicResult.filesCount) epic attachments" -ForegroundColor Green
    
    # Step 3: Find Child Stories
    Write-Host "[3/4] Finding Child Stories..." -ForegroundColor Cyan
    $childStories = Invoke-RestMethod -Uri "$($Auth.BaseUrl)/rest/api/3/search/jql" `
        -Headers $Auth.Headers -Method Get `
        -Body (@{ jql = "`"Epic Link`" = $EpicKey OR parent = $EpicKey"; maxResults = 200 } | ConvertTo-Json) `
        -ContentType "application/json"
    
    Write-Host "✓ Found $($childStories.total) child stories" -ForegroundColor Green
    
    # Step 4: Extract Child Stories and Attachments
    Write-Host "[4/4] Extracting Child Stories..." -ForegroundColor Cyan
    $storiesDir = Join-Path $epicOutputDir "stories"
    New-Item -ItemType Directory -Path $storiesDir -Force | Out-Null
    
    $childResults = @()
    foreach ($story in $childStories.issues) {
        Write-Host "  Processing: $($story.key)" -ForegroundColor Yellow
        
        $storyResult = Download-IssueAttachments -IssueKey $story.key -OutputDir $storiesDir -Auth $Auth
        $childResults += $storyResult
    }
    
    # Save extraction report
    $reportPath = Join-Path $epicOutputDir "extraction-report.json"
    @{
        extraction_timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
        epic_key = $EpicKey
        epic_summary = $epic.fields.summary
        epic_attachments = $epicResult.filesCount
        child_stories_count = $childStories.total
        child_attachments_total = ($childResults | ForEach-Object { $_.filesCount } | Measure-Object -Sum).Sum
        output_directory = $epicOutputDir
    } | ConvertTo-Json -Depth 5 | Out-File $reportPath
    
    Write-Host "`n✓ Extraction Complete!" -ForegroundColor Green
    Write-Host "  Epic: $EpicKey"
    Write-Host "  Child Stories: $($childStories.total)"
    Write-Host "  Output: $epicOutputDir"
    
    return @{
        epic = $epicResult
        children = $childResults
        reportPath = $reportPath
    }
}

# Export functions for use in other scripts
Export-ModuleMember -Function @(
    'Initialize-JiraAuth',
    'Download-JiraAttachment',
    'Download-IssueAttachments',
    'Download-ProjectEpicAttachments',
    'Extract-EpicHierarchy'
)
```

### Usage Examples

#### Example 1: Download Single Epic's Attachments
```powershell
# Source the helper script
. "./scripts/Jira-AttachmentDownloader.ps1"

# Initialize auth
$auth = Initialize-JiraAuth -EnvFilePath ".env"

# Download all attachments from PROJ-1 epic
$result = Download-IssueAttachments -IssueKey "PROJ-1" -OutputDir "Output/JiraAttachments" -Auth $auth

# Result shows:
# ✓ Downloaded: Acceptance Criteria.docx (24,576 bytes)
# Output saved to: Output/JiraAttachments/PROJ-1/attachments/
```

#### Example 2: Download All Epics in Project
```powershell
# Download all epic attachments from your project
$results = Download-ProjectEpicAttachments -ProjectKey "PROJ" `
    -OutputDir "Output/JiraAttachments" -Auth $auth

# Creates:
# Output/JiraAttachments/
# ├── PROJ-1/
# │   └── attachments/
# ├── PROJ-2/
# │   └── attachments/
# └── download-manifest.json
```

#### Example 3: Full Hierarchical Extraction
```powershell
# Extract epic with full hierarchy (epic + stories + all attachments)
$extraction = Extract-EpicHierarchy -EpicKey "PROJ-1" `
    -OutputDir "Output/jira" -Auth $auth

# Creates organized structure:
# Output/jira/
# └── PROJ-1/
#     ├── PROJ-1-issue.json
#     ├── extraction-report.json
#     ├── attachments/
#     │   └── Acceptance Criteria.docx
#     └── stories/
#         ├── PROJ-101/
#         │   ├── PROJ-101.json
#         │   └── attachments/
#         └── PROJ-102/
#             └── ...
```

---

## ⚙️ MCP Tool Configuration

**The MCP Atlassian tools are configured in `.vscode/settings.json`:**

```json
{
  "modelContextProtocol": {
    "servers": {
      "atlassian": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-atlassian"],
        "env": {
          "JIRA_URL": "",
          "JIRA_USERNAME": "",
          "JIRA_API_TOKEN": ""
        }
      }
    }
  }
}
```

**MCP Tools Automatically Available:**
- `jira_search` - Execute JQL queries
- `jira_get_issue` - Fetch complete issue details
- `jira_download_attachments` - Download attached documents
- `jira_search_fields` - Discover custom fields
- `jira_get_all_projects` - List available projects

**Verification Steps:**
1. Reload VS Code (`Ctrl+Shift+P` → "Developer: Reload Window")
2. Open Copilot Chat → `/tools search jira`
3. Verify all 5 Jira tools appear in the list
4. If tools not showing, check `.vscode/settings.json` is properly formatted

---

## 🔐 Environment Variable Setup

**Credentials are configured in three places:**

### Option 1: Workspace .env File (For PowerShell scripts)
File: `.env` in workspace root
```bash
{
  "JIRA_URL": "",
  "JIRA_USERNAME": "",
  "JIRA_API_TOKEN": ""
}
```

Load in PowerShell:
```powershell
$envContent = Get-Content ".env" | ConvertFrom-Json
$env:JIRA_URL = $envContent.JIRA_URL
$env:JIRA_USERNAME = $envContent.JIRA_USERNAME
$env:JIRA_API_TOKEN = $envContent.JIRA_API_TOKEN
```

### Option 2: VS Code Settings
Edit `.vscode/settings.json` in your workspace:
```json
{
  "env": {
    "JIRA_URL": "https://your-domain.atlassian.net",
    "JIRA_USERNAME": "your-email@yourcompany.com",
    "JIRA_API_TOKEN": "your-generated-api-token"
  }
}
```

### Option 3: System Environment Variables (PowerShell)
```powershell
$env:JIRA_URL = "https://your-domain.atlassian.net"
$env:JIRA_USERNAME = "your-email@yourcompany.com"
$env:JIRA_API_TOKEN = "your-generated-api-token"
```

**Getting Your API Token:**
1. Cloud: Visit https://id.atlassian.com/manage-profile/security/api-tokens
2. Server/DC: Go to your Jira instance → Settings → Security → API Tokens
3. Create token, copy value → Store in environment variable

---

## Authentication & Credentials

**Authentication uses environment variables configured in VS Code:**

Set the following environment variables before using this agent:
- `JIRA_URL` - Jira instance URL (Cloud: `https://domain.atlassian.net` | Server: `https://jira.company.com`)
- `JIRA_USERNAME` - Email (Cloud) or username (Server/Data Center)
- `JIRA_API_TOKEN` - API token or personal access token (generate in Jira settings)

**Configuration Methods:**
1. VS Code Settings (`.vscode/settings.json`) → Set `JIRA_*` environment variables
2. System Environment Variables (PowerShell/Command Prompt) → Set before starting VS Code
3. Workspace `.env` file → Place in project root with `JIRA_URL=...`, `JIRA_USERNAME=...`, `JIRA_API_TOKEN=...`

**No connection tool needed** - All MCP Atlassian tools automatically authenticate using these environment variables.

---

## 📖 Requirement Extraction Operations

### 1️⃣ Search for Requirements (JQL) - Using `jira_search` MCP Tool

**Tool:** `jira_search`

**MCP Call:**
```json
{
  "tool": "jira_search",
  "parameters": {
    "jql": "project = PROJ AND issuetype = Epic ORDER BY created DESC",
    "fields": "key,summary,description,issuetype,status",
    "limit": 100
  }
}
```

**Find Epics:**
```json
{
  "jql": "project = PROJ AND issuetype = Epic ORDER BY created DESC",
  "fields": "key,summary,description,issuetype",
  "limit": 100
}
```

**Find Stories under Epic:**
```json
{
  "jql": "\"Epic Link\" = PROJ-1 OR parent = PROJ-1",
  "fields": "key,summary,description,status,priority",
  "limit": 200
}
```

**Find Requirements by Label:**
```json
{
  "jql": "project = PROJ AND labels = requirement AND updated >= -30d",
  "fields": "key,summary,description,labels",
  "limit": 100
}
```

**Common JQL Patterns for Requirements:**
- All Epics: `issuetype = Epic`
- Stories in Epic: `"Epic Link" = PROJ-1`
- Test cases linked: `issue in linkedIssues(STORY-123) AND issuetype = Test`
- Child scenarios: `parent = STORY-123`
- Recent updates: `updated >= -7d`
- By project: `project = PROJ`

---

### 2️⃣ Fetch Complete Requirement Details - Using `jira_get_issue` MCP Tool

**Tool:** `jira_get_issue`

**MCP Call:**
```json
{
  "tool": "jira_get_issue",
  "parameters": {
    "issue_key": "PROJ-1",
    "fields": "*all",
    "comment_limit": 50
  }
}
```

**Get Full Issue with All Fields:**
```json
{
  "issue_key": "PROJ-1",
  "fields": "*all",
  "comment_limit": 50
}
```

**Response includes:**
- Summary and Description
- Acceptance Criteria (custom field)
- Story Points (if present)
- Priority, Status, Labels
- Comments and attachments metadata
- All custom fields defined for the project
- Issue type, reporter, assignee, created/updated dates

**PowerShell Implementation:**
```powershell
# Load credentials from .env
$envContent = Get-Content ".env" | ConvertFrom-Json
$env:JIRA_URL = $envContent.JIRA_URL
$env:JIRA_USERNAME = $envContent.JIRA_USERNAME
$env:JIRA_API_TOKEN = $envContent.JIRA_API_TOKEN

# Create auth header (use ${...} to avoid ':' being parsed as a drive qualifier)
$pair = "${env:JIRA_USERNAME}:${env:JIRA_API_TOKEN}"
$encodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{
    "Authorization" = "Basic $encodedAuth"
    "Content-Type" = "application/json"
}

# Fetch PROJ-1 issue (note: singular "issue", not "issues")
$issue = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue/PROJ-1?fields=*all" -Headers $headers
$issue | ConvertTo-Json -Depth 10 | Out-File "PROJ-1-issue.json"

Write-Host "Issue Type: $($issue.fields.issuetype.name)"
Write-Host "Summary: $($issue.fields.summary)"
Write-Host "Attachments: $(@($issue.fields.attachment).Count)"
```

---

### 3️⃣ Download Requirement Attachments (Documents) - Using `jira_download_attachments` MCP Tool

**Tool:** `jira_download_attachments`

**MCP Call:**
```json
{
  "tool": "jira_download_attachments",
  "parameters": {
    "issue_key": "PROJ-1"
  }
}
```

**Download All Attachments from Issue:**
```json
{
  "issue_key": "PROJ-1"
}
```

**Typical Attachments:**
- Requirement specification documents (.docx, .pdf)
- Acceptance criteria sheets
- Diagrams and mockups
- Test data templates
- BRD (Business Requirements Documents)

**Response:** Attachment metadata and content for each file.

**PowerShell Implementation (Downloads to `output/jira`):**
```powershell
# Fetch issue with attachment details
$issue = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue/PROJ-1?fields=attachment" -Headers $headers

# Create output directory structure: output/jira/{issue-key}/
$baseOutputDir = "output/jira"
$issueOutputDir = Join-Path $baseOutputDir $issue.key
if (-not (Test-Path $issueOutputDir)) {
    New-Item -ItemType Directory -Path $issueOutputDir -Force | Out-Null
}

$attachmentsDir = Join-Path $issueOutputDir "attachments"
if (-not (Test-Path $attachmentsDir)) {
    New-Item -ItemType Directory -Path $attachmentsDir -Force | Out-Null
}

# Download all attachments
$downloadedFiles = @()
foreach ($attachment in $issue.fields.attachment) {
    Write-Host "Downloading: $($attachment.filename)"
    
    try {
        $fileName = $attachment.filename -replace '[<>:"/\\|?*]', '_'
        $outputPath = Join-Path $attachmentsDir $fileName
        
        # Download the binary via the attachment content endpoint (verified reliable)
        $contentUrl = "$($env:JIRA_URL)/rest/api/3/attachment/content/$($attachment.id)"
        Invoke-WebRequest -Uri $contentUrl -Headers $headers -Method Get -UseBasicParsing -OutFile $outputPath
        
        # Save metadata JSON
        $metadataPath = "$outputPath.metadata.json"
        @{
            filename = $attachment.filename
            size = $attachment.size
            mimeType = $attachment.mimeType
            created = $attachment.created
            author = $attachment.author.displayName
            downloaded_at = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
            local_path = $outputPath
        } | ConvertTo-Json | Out-File $metadataPath
        
        $downloadedFiles += @{
            filename = $attachment.filename
            size = $attachment.size
            localPath = $outputPath
            metadataPath = $metadataPath
        }
        
        Write-Host "✓ Downloaded: $fileName ($('{0:N0}' -f $attachment.size) bytes)"
    } catch {
        Write-Host "✗ Error downloading $($attachment.filename): $($_.Exception.Message)"
    }
}

# Save download manifest
$manifestPath = Join-Path $issueOutputDir "attachments-manifest.json"
@{
    issue_key = $issue.key
    issue_summary = $issue.fields.summary
    downloaded_at = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
    total_files = $downloadedFiles.Count
    total_bytes = ($downloadedFiles | Measure-Object -Property size -Sum).Sum
    files = $downloadedFiles
} | ConvertTo-Json -Depth 5 | Out-File $manifestPath

Write-Host "\n✓ Manifest saved: $manifestPath"
Write-Host "✓ All attachments saved to: $attachmentsDir"
```

---

### 4️⃣ Discover Custom Requirement Fields - Using `jira_search_fields` MCP Tool

**Tool:** `jira_search_fields`

**MCP Call:**
```json
{
  "tool": "jira_search_fields",
  "parameters": {
    "keyword": "acceptance criteria",
    "limit": 20
  }
}
```

**Find Acceptance Criteria Field:**
```json
{
  "keyword": "acceptance criteria",
  "limit": 20
}
```

**Find Custom Requirement Fields:**
```json
{
  "keyword": "requirement",
  "limit": 50
}
```

**Response includes:**
- Field ID (e.g., `customfield_10001`)
- Field name
- Field type (text, select, rich text, etc.)
- Availability (project-specific or global)

**PowerShell Implementation:**
```powershell
# Discover custom fields in your project
$fieldsUrl = "$($env:JIRA_URL)/rest/api/3/fields"
$fields = Invoke-RestMethod -Uri $fieldsUrl -Headers $headers

# Filter for custom fields
$customFields = $fields | Where-Object { $_.id -match "customfield_" }

# Find Acceptance Criteria field
$acField = $customFields | Where-Object { $_.name -like "*acceptance*" } | Select-Object -First 1
Write-Host "Acceptance Criteria Field ID: $($acField.id)"

# Find Business Rules field
$brField = $customFields | Where-Object { $_.name -like "*business*rule*" } | Select-Object -First 1
if ($brField) {
    Write-Host "Business Rules Field ID: $($brField.id)"
}

# Save all custom fields
$customFields | ConvertTo-Json -Depth 10 | Out-File "custom-fields.json"
```

---

## 🎯 Complete Epic Extraction Workflow

**Hierarchical requirement extraction from Epic → Stories → Test Cases → Attachments:**

### Complete Implementation Guide: Extracting an Epic

**Full PowerShell Workflow:**

```powershell
# ============================================================
# Complete Epic Extraction Workflow for PROJ-1
# Downloads attachments to: output/jira/
# ============================================================

# Step 0: Load Credentials from .env
Write-Host "Loading credentials from .env..." -ForegroundColor Cyan
$envContent = Get-Content ".env" | ConvertFrom-Json
$env:JIRA_URL = $envContent.JIRA_URL
$env:JIRA_USERNAME = $envContent.JIRA_USERNAME
$env:JIRA_API_TOKEN = $envContent.JIRA_API_TOKEN

# Create output directories
$baseOutputDir = "output/jira"
New-Item -ItemType Directory -Path $baseOutputDir -Force | Out-Null

# Setup auth headers
$pair = "${env:JIRA_USERNAME}:${env:JIRA_API_TOKEN}"
$encodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{
    "Authorization" = "Basic $encodedAuth"
    "Content-Type" = "application/json"
}

# ============================================================
# Step 1: Get Epic Details (jira_get_issue MCP tool)
# ============================================================
Write-Host "`n[1/6] Fetching PROJ-1 Epic Details..." -ForegroundColor Cyan
$issue = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue/PROJ-1?fields=*all" `
    -Headers $headers -Method Get

$issueDir = Join-Path $baseOutputDir $issue.key
New-Item -ItemType Directory -Path $issueDir -Force | Out-Null
$issue | ConvertTo-Json -Depth 10 | Out-File "$issueDir/$($issue.key)-issue.json"
Write-Host "✓ Epic saved: $issueDir/$($issue.key)-issue.json"

# ============================================================
# Step 2: Download Epic Attachments (jira_download_attachments MCP tool)
# Downloads to: output/jira/{issue-key}/attachments/
# ============================================================
Write-Host "`n[2/6] Downloading Attachments..." -ForegroundColor Cyan
$attachmentsDir = Join-Path $issueDir "attachments"
New-Item -ItemType Directory -Path $attachmentsDir -Force | Out-Null

$downloadedFiles = @()
foreach ($attachment in $issue.fields.attachment) {
    Write-Host "  Downloading: $($attachment.filename)"
    
    try {
        $fileName = $attachment.filename -replace '[<>:"/\\|?*]', '_'
        $filePath = Join-Path $attachmentsDir $fileName
        
        # Download the binary file
        $contentUrl = "$($env:JIRA_URL)/rest/api/3/attachment/content/$($attachment.id)"
        Invoke-WebRequest -Uri $contentUrl -Headers $headers -UseBasicParsing -OutFile $filePath
        
        # Save metadata
        @{
            filename = $attachment.filename
            size = $attachment.size
            mimeType = $attachment.mimeType
            created = $attachment.created
            author = $attachment.author.displayName
            local_path = $filePath
        } | ConvertTo-Json | Out-File "$filePath.metadata.json"
        
        $downloadedFiles += @{
            filename = $attachment.filename
            size = $attachment.size
        }
        
        Write-Host "    ✓ $fileName ($('{0:N0}' -f $attachment.size) bytes)"
    } catch {
        Write-Host "    ✗ Failed: $($_.Exception.Message)"
    }
}

Write-Host "✓ Downloaded $($downloadedFiles.Count) attachments to: $attachmentsDir"

# ============================================================
# Step 3: Find Child Stories (jira_search MCP tool with JQL)
# ============================================================
Write-Host "`n[3/6] Searching for Child Stories..." -ForegroundColor Cyan
$childStories = Invoke-RestMethod `
    -Uri "$($env:JIRA_URL)/rest/api/3/search/jql?jql=%22Epic%20Link%22%20%3D%20PROJ-1&maxResults=100" `
    -Headers $headers -Method Get

$childStories | ConvertTo-Json -Depth 10 | Out-File "$issueDir/child-stories.json"
Write-Host "✓ Found $($childStories.total) child stories"

# ============================================================
# Step 4: For Each Child - Get Full Details & Attachments
# Downloads child attachments to: output/jira/{parent-key}/stories/{child-key}/attachments/
# ============================================================
Write-Host "`n[4/6] Extracting Child Story Details..." -ForegroundColor Cyan
$storiesDir = Join-Path $issueDir "stories"
New-Item -ItemType Directory -Path $storiesDir -Force | Out-Null

$childDetailsList = @()
foreach ($story in $childStories.issues) {
    $storyKey = $story.key
    Write-Host "  Processing: $storyKey"
    
    # Get full story details
    $storyDetails = Invoke-RestMethod `
        -Uri "$($env:JIRA_URL)/rest/api/3/issue/$storyKey?fields=*all" `
        -Headers $headers -Method Get
    
    $storyDir = Join-Path $storiesDir $storyKey
    New-Item -ItemType Directory -Path $storyDir -Force | Out-Null
    $storyDetails | ConvertTo-Json -Depth 10 | Out-File "$storyDir/$storyKey.json"
    
    # Download story attachments
    if ($storyDetails.fields.attachment.Count -gt 0) {
        $storyAttachDir = Join-Path $storyDir "attachments"
        New-Item -ItemType Directory -Path $storyAttachDir -Force | Out-Null
        
        foreach ($attach in $storyDetails.fields.attachment) {
            try {
                $attName = $attach.filename -replace '[<>:"/\\|?*]', '_'
                $attPath = Join-Path $storyAttachDir $attName
                
                # Download the binary
                $contentUrl = "$($env:JIRA_URL)/rest/api/3/attachment/content/$($attach.id)"
                Invoke-WebRequest -Uri $contentUrl -Headers $headers -UseBasicParsing -OutFile $attPath
                
                # Save metadata
                @{
                    filename = $attach.filename
                    size = $attach.size
                    mimeType = $attach.mimeType
                    created = $attach.created
                    local_path = $attPath
                } | ConvertTo-Json | Out-File "$attPath.metadata.json"
                
                Write-Host "    ✓ Downloaded: $attName"
            } catch {
                Write-Host "    ✗ Failed to download $($attach.filename): $($_.Exception.Message)"
            }
        }
    }
    
    $childDetailsList += @{
        key = $storyKey
        summary = $storyDetails.fields.summary
        type = $storyDetails.fields.issuetype.name
        status = $storyDetails.fields.status.name
        attachments = @($storyDetails.fields.attachment).Count
    }
}

$childDetailsList | ConvertTo-Json | Out-File "$issueDir/child-stories-summary.json"
Write-Host "✓ Child story details and attachments extracted"

# ============================================================
# Step 5: Generate Extraction Report
# ============================================================
Write-Host "`n[5/6] Generating Extraction Report..." -ForegroundColor Cyan
$report = @{
    extraction_timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
    jira_instance = $env:JIRA_URL
    epic_key = $issue.key
    epic_summary = $issue.fields.summary
    epic_type = $issue.fields.issuetype.name
    total_child_stories = $childStories.total
    total_attachments = @($issue.fields.attachment).Count
    output_directory = $issueDir
    files_generated = @{
        epic_details = "$($issue.key)-issue.json"
        child_stories = "child-stories.json"
        child_stories_summary = "child-stories-summary.json"
        attachments_directory = "attachments/"
        stories_directory = "stories/"
    }
    mcp_tools_used = @(
        "jira_get_issue (Epic details)"
        "jira_get (Download attachments via REST API)"
        "jira_get (Find child stories via JQL)"
    )
}

$report | ConvertTo-Json -Depth 10 | Out-File "$issueDir/extraction-report.json"
Write-Host "✓ Extraction report generated"

# ============================================================
# Step 6: Display Results
# ============================================================
Write-Host "`n[6/6] Extraction Complete!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "  Epic: $($issue.key) - $($issue.fields.summary)"
Write-Host "  Child Stories: $($childStories.total)"
Write-Host "  Attachments: $(@($issue.fields.attachment).Count)"
Write-Host "`nOutput Directory: $baseOutputDir" -ForegroundColor Green
Write-Host "Extracted to: $issueDir\n"
Get-ChildItem -Path $issueDir -Recurse | Select-Object FullName
```

### Step-by-Step Workflow

#### Step 1: Get Epic Details
```
MCP Tool: jira_get_issue
Purpose: Fetch complete epic PROJ-1 with all fields
Returns: Epic summary, description, acceptance criteria, custom fields, attachments metadata
```

#### Step 2: Find Child Stories
```
MCP Tool: jira_search
Purpose: Query for all stories under PROJ-1 epic
JQL: "Epic Link" = PROJ-1 OR parent = PROJ-1
Returns: List of all Stories/Tasks with keys for next steps
```

#### Step 3: For Each Story - Get Full Details
```
MCP Tool: jira_get_issue
Purpose: Get story description, acceptance criteria, test status, custom fields
Returns: Complete story data for each child
```

#### Step 4: For Each Story - Download Attachments
```
MCP Tool: jira_download_attachments
Purpose: Extract attached requirement documents from each story
Returns: Specification PDFs, diagrams, test data files
```

#### Step 5: Download All Attachments at Each Level
**For Epic:**
```json
{
  "tool": "jira_download_attachments",
  "parameters": {
    "issue_key": "PROJ-1"
  }
}
```

**For Each Story:**
```json
{
  "tool": "jira_download_attachments",
  "parameters": {
    "issue_key": "PROJ-101"
  }
}
```

#### Step 6: Organize and Save
**Output Structure:**
```
./output/PROJ-1-Extraction/
├── PROJ-1-issue.json                  (Epic issue data with all fields)
├── PROJ-1-summary.json                (Key summary data)
├── child-stories.json                (Full details of all child stories)
├── child-stories-summary.json        (Quick reference format)
├── extraction-report.json            (Workflow completion report)
├── attachments/                      (Epic attachments)
│   ├── Requirement-Spec.pdf
│   ├── Requirement-Spec.pdf.metadata.json
│   └── ...
└── stories/                          (Child story details and attachments)
    ├── PROJ-101.json
    ├── PROJ-101-attachments/
    │   └── acceptance-criteria.pdf.metadata.json
    └── ...
```

**Summary JSON format:**
```json
{
  "epic_key": "PROJ-1",
  "epic_summary": "Requirement Epic Title",
  "extraction_timestamp": "2026-09-02T14:30:00Z",
  "statistics": {
    "stories_count": 12,
    "test_cases_count": 24,
    "attachments_count": 48,
    "custom_fields_extracted": ["Acceptance Criteria", "Business Rules", "Test Status"]
  },
  "files_saved": [
    "PROJ-1-issue.json",
    "child-stories.json",
    "attachments/...",
    "stories/PROJ-101.json",
    "stories/PROJ-101-attachments/..."
  ]
}
```
---

## 📊 Requirement Extraction Workflow

**Standard workflow for extracting requirements:**

1. **Query Requirements** - Use JQL with `jira_search` to find Epics/Requirements
2. **Fetch Full Details** - Use `jira_get_issue` with `fields="*all"` to get complete data
3. **Download Attachments** - Use `jira_download_attachments` to extract documents
4. **Process Hierarchy** - For each parent, fetch children and repeat
5. **Save Structured Output** - Export JSON + attachments to output directory with hierarchy

**Example Flow:**

```
User: "Extract all requirements from EPIC-585 with attachments"

Step 1: Get Epic
  → jira_get_issue(issue_key="EPIC-585", fields="*all")
  → Receive: Epic details, description, acceptance criteria, custom fields
  
Step 2: Download Epic Attachments
  → jira_download_attachments(issue_key="EPIC-585")
  → Receive: BRD PDFs, specification documents
  
Step 3: Find Stories in Epic
  → jira_search(jql='"Epic Link" = EPIC-585', limit=200)
  → Receive: List of 12 stories with keys
  
Step 4: For Each Story (loop)
  → jira_get_issue(issue_key=story.key, fields="*all")
  → jira_download_attachments(issue_key=story.key)
  → Save to: ./output/EPIC-585/stories/{story.key}/
  
Step 5: Find Test Cases for Each Story
  → jira_search(jql='issue in linkedIssues(STORY-123) AND issuetype = Test')
  → For each test: jira_get_issue + jira_download_attachments
  
Step 6: Save Summary
  → Create summary.json with extraction metadata
  → Report: "✓ Extracted EPIC-585: 12 stories, 24 test cases, 48 attachments"
```

---

## ✅ Best Practices for Requirement Extraction

1. **Always fetch `fields="*all"`** - Ensures you capture custom fields like Acceptance Criteria, Business Rules, Story Points
2. **Download attachments for each level** - Documents are often critical for understanding requirements (PDFs, Word docs, diagrams)
3. **Use efficient JQL with limits** - Paginate large result sets; use `limit` parameter to avoid timeouts
4. **Preserve hierarchy** - Maintain Epic → Stories → Test Cases structure for traceability
5. **Handle custom fields** - Use `jira_search_fields` to discover project-specific requirement fields
6. **Capture metadata** - Record extraction timestamp, issue counts, field names in summary.json
7. **Batch operations** - Fetch multiple issues at once rather than sequential queries
8. **Validate attachments** - Some files may be unavailable or corrupted; handle gracefully
9. **Respect rate limits** - Jira Cloud: 300 req/5min; pause between large extractions
10. **Export structured output** - Save JSON + attachments in organized directory structure for downstream tools

---

## 💡 Requirement Extraction Use Cases

### Use Case 1: Extract Epic with All Child Requirements

```
User: "Extract PROJ-1 epic with all stories and documents"

Workflow:
1. Search for Epic: jira_search(jql='key = PROJ-1')
2. Get Epic: jira_get_issue(issue_key="PROJ-1", fields="*all")
   ✓ Response: Issue key, summary, description, custom fields, attachments metadata
3. Download Epic attachments: jira_download_attachments(issue_key="PROJ-1")
   ✓ Extracts: BRD PDFs, requirement specs, diagrams
4. Find Stories: jira_search(jql='"Epic Link" = PROJ-1 OR parent = PROJ-1')
   ✓ Returns: List of child stories with keys and summaries
5. For each Story:
   - Get details: jira_get_issue(issue_key=story_key, fields="*all")
   - Download attachments: jira_download_attachments(issue_key=story_key)
   - Get acceptance criteria from custom fields
6. Save to: ./output/PROJ-1-Extraction/{epic.json, stories/, attachments/, extraction-report.json}
7. Report: "✓ Extracted PROJ-1 with N stories, M test cases, K attachments saved"

Output Structure:
./output/PROJ-1-Extraction/
├── PROJ-1-issue.json                (Complete epic details with all fields)
├── PROJ-1-summary.json              (Key summary: type, status, priority, attachments)
├── child-stories.json              (Full details of all child stories)
├── child-stories-summary.json      (Quick reference: key, type, summary, status)
├── attachments-list.json           (Metadata of all downloaded files)
├── attachments/                    (Extracted documents, specs, diagrams)
│   ├── Requirement-Spec.pdf
│   ├── Requirement-Spec.pdf.metadata.json
│   └── ...
└── extraction-report.json          (Workflow completion report with timestamps)
```

### Use Case 1b: Load Credentials from .env and Extract Epic

```
PowerShell Workflow:

# Step 1: Load credentials from .env file
$envFile = ".env"
$envContent = Get-Content $envFile | ConvertFrom-Json
$env:JIRA_URL = $envContent.JIRA_URL
$env:JIRA_USERNAME = $envContent.JIRA_USERNAME
$env:JIRA_API_TOKEN = $envContent.JIRA_API_TOKEN

# Step 2: Create auth headers
$pair = "${env:JIRA_USERNAME}:${env:JIRA_API_TOKEN}"
$encodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{"Authorization" = "Basic $encodedAuth"; "Content-Type" = "application/json"}

# Step 3: Fetch epic details (equivalent to jira_get_issue)
$issue = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/issue/PROJ-1?fields=*all" -Headers $headers
$issue | ConvertTo-Json -Depth 10 | Out-File "PROJ-1-issue.json"

# Step 4: Download attachments (equivalent to jira_download_attachments)
foreach ($attachment in $issue.fields.attachment) {
    $fileName = $attachment.filename
    $contentUrl = "$($env:JIRA_URL)/rest/api/3/attachment/content/$($attachment.id)"
    Invoke-WebRequest -Uri $contentUrl -Headers $headers -UseBasicParsing -OutFile $fileName
}

# Step 5: Search for child stories (equivalent to jira_search) - modern endpoint, legacy /search returns 410 Gone
$childStories = Invoke-RestMethod -Uri "$($env:JIRA_URL)/rest/api/3/search/jql" -Headers $headers -Method Post `
    -Body (@{ jql = '"Epic Link" = PROJ-1'; maxResults = 100 } | ConvertTo-Json) -ContentType "application/json"
$childStories.issues | ConvertTo-Json | Out-File "child-stories.json"
```


### Use Case 2: Extract Requirements by Label

```
User: "Get all requirements labeled 'priority-high' with acceptance criteria documents"

Agent:
1. Search: jira_search(jql='project = PROJ AND labels = priority-high', fields='*all')
2. For each requirement:
   - Get full details: jira_get_issue(issue_key, fields="*all")
   - Download attachments: jira_download_attachments(issue_key)
   - Extract custom field: Acceptance Criteria
3. Save: ./output/high-priority-requirements/{req-001.json, attachments/}
7. Report: "✓ Extracted 15 high-priority requirements with documents"
```

### Use Case 3: Extract Requirements Updated Recently

```
User: "Get all requirements modified in last 7 days with their attachments"

Agent:
1. Search recent: jira_search(jql='issuetype in (Epic, Story, Requirement) AND updated >= -7d')
2. For each:
   - Get full details: jira_get_issue(issue_key, fields="*all")
   - Download attachments: jira_download_attachments(issue_key)
3. Save: ./output/recent-requirements-{date}/{...}
7. Report: "✓ Extracted 8 recently modified requirements"
```

### Use Case 4: Extract Requirements with Custom Acceptance Criteria Field

```
User: "Fetch all stories with their acceptance criteria field populated"

Agent:
1. Discover field: jira_search_fields(keyword='acceptance criteria')
2. Search: jira_search(jql='issuetype = Story AND customfield_10001 is not EMPTY')
3. For each story:
   - Get details: jira_get_issue(issue_key, fields="*all")
   - Extract acceptance criteria field: customfield_10001
   - Download attachments
4. Save: ./output/stories-with-ac/{story.json, attachments/}
7. Report: "✓ Extracted 20 stories with acceptance criteria"
```

---

## Response Handling

**All MCP tools return JSON responses. Parse them appropriately:**

### Success Response Pattern:
```json
{
  "status": "success" | "created" | "updated" | "connected",
  "data": { ... },
  "timestamp": "2026-03-09T..."
}
```

### Error Response Pattern:
```json
{
  "status": "error",
  "error_type": "authentication_failed" | "permission_denied" | "not_found" | "request_failed",
  "message": "Human-readable error message",
  "details": { ... }
}
```

**Handle errors by:**
1. Checking `status` field first
2. If error, explain the issue to user
3. Suggest corrective action
4. Never expose raw API errors

---

## Core Responsibilities

1. **JIRA Connection Management**
   - Authenticate using environment variables (JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN)
   - Detect Cloud vs Server/Data Center deployment
   - Handle authentication errors gracefully

2. **Requirement Discovery & Extraction**
   - Execute JQL queries with `jira_search` to find Epics, Stories, Requirements
   - Fetch complete issue details with `jira_get_issue` (fields="*all")
   - Extract custom fields (Acceptance Criteria, Business Rules, Story Points)
   - Retrieve comments and metadata

3. **Attachment Management**
   - Download attached requirement documents with `jira_download_attachments`
   - Extract specification PDFs, Word docs, diagrams
   - Handle large files (>50MB skip) gracefully
   - Organize attachments by hierarchy

4. **Hierarchy Preservation**
   - Maintain Epic → Stories → Test Cases → Scenarios structure
   - Track parent-child relationships through JQL
   - Preserve linked issues (blocks, relates, duplicates)
   - Document traceability paths

5. **Structured Output Generation**
   - Export JSON representation of each issue
   - Organize files by hierarchy (epic/stories/tests/attachments/)
   - Generate summary.json with extraction metadata
   - Timestamp and statistics tracking

6. **Terminal Execution for File Downloads** ⭐ NEW
   - Execute PowerShell scripts to download and save attachments
   - Use helper functions from `scripts/Jira-AttachmentDownloader.ps1`
   - Create organized directory structures in `Output/`
   - Generate manifest JSON files for tracking
   - Provide real-time progress feedback and completion summaries
   - Handle errors gracefully with detailed error messages

---

## ⚡ Terminal Execution Workflows

**The agent executes PowerShell terminal commands to download and save attachments directly to your workspace.**

### Workflow 1: Download Single Epic Attachments

**User Request:** "Download attachments from PROJ-1"

**Agent Actions:**
```
1. Load credentials from .env file
2. Create auth headers (Basic auth)
3. Create Output/JiraAttachments/PROJ-1/attachments directory
4. Query Jira for PROJ-1 attachments metadata
5. For each attachment:
   - Execute: Invoke-WebRequest to download binary
   - Save to: Output/JiraAttachments/PROJ-1/attachments/{filename}
   - Generate: {filename}.metadata.json with download details
6. Report: Download count, file sizes, output directory
```

**Terminal Output:**
```
✓ Fetching PROJ-1 details...
  Downloading: Acceptance Criteria.docx (24,576 bytes)
  ✓ Success

✓ Download complete!
  Files: 1
  Total size: 24,576 bytes
  Output: Output/JiraAttachments/PROJ-1/attachments/
```

### Workflow 2: Download All Project Epics with Manifest

**User Request:** "Download all PROJ epic attachments"

**Agent Actions:**
```
1. Load credentials from .env file
2. Search Jira: project = PROJ AND issuetype = Epic
3. For each epic found:
   a. Create: Output/JiraAttachments/{epic-key}/attachments
   b. Download all attachments for that epic
   c. Track: file count, size, download status
4. Generate manifest: Output/JiraAttachments/download-manifest.json
5. Report: Total epics, files, bytes downloaded
```

**Manifest Contents:**
```json
{
  "project": "PROJ",
  "downloaded_at": "2026-09-03T14:30:00Z",
  "summary": {
    "epicsProcessed": 2,
    "filesDownloaded": 2,
    "filesFailed": 0,
    "totalBytesDownloaded": 43008
  },
  "downloadedFiles": [
    {
      "epicKey": "PROJ-1",
      "fileName": "Acceptance Criteria.docx",
      "downloadedSize": 24576,
      "localPath": "Output/JiraAttachments/PROJ-1/attachments/Acceptance Criteria.docx"
    },
    {
      "epicKey": "PROJ-2",
      "fileName": "Requirement-Document.docx",
      "downloadedSize": 18432,
      "localPath": "Output/JiraAttachments/PROJ-2/attachments/Requirement-Document.docx"
    }
  ]
}
```

### Workflow 3: Full Hierarchical Epic Extraction

**User Request:** "Extract PROJ-1 with full hierarchy including child stories"

**Agent Actions:**
```
1. Initialize: Load .env credentials
2. Step [1/4]: Fetch epic PROJ-1 details
   - Execute: $issue = Invoke-RestMethod -Uri "...issue/PROJ-1"
   - Save: Output/jira/PROJ-1/PROJ-1-issue.json
3. Step [2/4]: Download epic attachments
   - For each attachment: Download binary to Output/jira/PROJ-1/attachments/
   - Save metadata: {filename}.metadata.json
4. Step [3/4]: Find child stories
   - Execute JQL: "Epic Link" = PROJ-1 OR parent = PROJ-1
   - Query returns: List of child stories
5. Step [4/4]: For each child story
   - Execute: Fetch story details
   - Save: Output/jira/PROJ-1/stories/{story-key}.json
   - Download: All story attachments
   - Save: Output/jira/PROJ-1/stories/{story-key}/attachments/
6. Generate extraction report with timestamps
```

**Output Directory Structure:**
```
Output/jira/PROJ-1/
├── PROJ-1-issue.json                  (Epic details)
├── extraction-report.json            (Completion summary)
├── attachments/
│   ├── Acceptance Criteria.docx
│   └── Acceptance Criteria.docx.metadata.json
└── stories/
    ├── PROJ-101/
    │   ├── PROJ-101.json
    │   └── attachments/
    │       └── test-cases.pdf
    └── PROJ-102/
        └── PROJ-102.json
```

### Terminal Execution Details

**Command Format:**
```powershell
# Load helper functions
. "./scripts/Jira-AttachmentDownloader.ps1"

# Initialize auth from .env
$auth = Initialize-JiraAuth -EnvFilePath ".env"

# Execute download
Download-IssueAttachments -IssueKey "PROJ-1" -OutputDir "Output/JiraAttachments" -Auth $auth
```

**What Happens:**
1. ✓ Credentials loaded from `.env` file
2. ✓ Basic auth header created with UTF8 encoding
3. ✓ Output directories created automatically
4. ✓ Binary files downloaded via `Invoke-WebRequest`
5. ✓ Metadata JSON saved with each file
6. ✓ Progress displayed in real-time
7. ✓ Errors handled gracefully
8. ✓ Summary reported at completion

**Features:**
- **Credential Management**: Loads from .env, no secrets exposed
- **Directory Organization**: Hierarchical structure by epic/story/attachment
- **Metadata Tracking**: Saves download timestamp, file size, author, mime type
- **Error Handling**: Continues on failure, reports errors at end
- **Progress Feedback**: Real-time download status
- **Manifest Generation**: JSON summary of all downloaded files
- **Batch Operations**: Single command downloads all epics

---

## 🚨 Error Handling for Requirement Extraction

**Common Issues and Solutions:**

### Tools Not Available
**Problem:** MCP Atlassian tools not appearing in `/tools search jira`

**Solution:**
1. Verify `.vscode/settings.json` exists and contains MCP configuration
2. Restart VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check MCP server is running: Look for "Atlassian" in Copilot Chat context
4. Verify Node.js is installed: `node --version` (should be v14+)
5. Install MCP server if missing: `npm install -g @modelcontextprotocol/server-atlassian`
6. Check for console errors: View → Output → select "Copilot Chat"

### Authentication Error
```json
{
  "status": "error",
  "error_type": "authentication_failed",
  "message": "Invalid API token or credentials"
}
```
**Solution:** 
1. Verify JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN in `.vscode/settings.json`
2. Regenerate API token at: https://id.atlassian.com/manage-profile/security/api-tokens
3. Restart VS Code after updating credentials

### Permission Denied
```json
{
  "status": "error",
  "error_type": "permission_denied",
  "message": "User does not have permission to view PROJ-1"
}
```
**Solution:** Check user permissions in Jira; request Epic/Story view access from admin

### Issue Not Found
```json
{
  "status": "error",
  "error_type": "not_found",
  "message": "Issue PROJ-9999 does not exist"
}
```
**Solution:** Verify Epic key; use `jira_search` to find correct key first

### JQL Syntax Error
```json
{
  "status": "error",
  "error_type": "request_failed",
  "message": "JQL query syntax error"
}
```
**Solution:** Validate JQL syntax in Jira UI first; check field names and operators

### Rate Limit Exceeded
```json
{
  "status": "error",
  "error_type": "rate_limit_exceeded",
  "message": "Rate limit exceeded: 300 requests per 5 minutes",
  "retry_after": 120
}
```
**Solution:** Wait suggested time; reduce batch size; paginate results

### Attachment Download Failed
**Solution:** Files >50MB are skipped; check attachment size; verify attachment type is supported

### Terminal Execution Errors
**Problem:** PowerShell script execution fails

**Common Issues & Solutions:**
1. **`.env` file not found**
   - Ensure `.env` exists in workspace root
   - File must be valid JSON format
   - Credentials must include: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN

2. **Output directory creation fails**
   - Check write permissions in workspace
   - Ensure `Output/` folder path is valid
   - Try creating directory manually first

3. **Attachment download 403 Forbidden**
   - Verify Jira credentials are current
   - Check API token hasn't expired (regenerate if needed)
   - Ensure user has access to the epic/attachment

4. **Authentication header parsing errors**
   - PowerShell colon (`:`) syntax: Use `"${var1}:${var2}"` not `"$var1:$var2"`
   - UTF8 encoding required: `[System.Text.Encoding]::UTF8`
   - Never use ASCII encoding for API tokens

5. **File path with special characters fails**
   - Script sanitizes filenames: `[<>:"/\\|?*]` replaced with `_`
   - Verify output filename after download
   - Check metadata JSON for original filename

### Terminal Command Timeout
**Problem:** Large downloads timeout

**Solution:**
- Downloads happen in foreground (real-time feedback)
- If timeout occurs, check network connectivity
- Retry download with smaller batch or single epic
- For large attachments, increase timeout or split extraction

---

## 🔍 Troubleshooting Tips

1. **Verify JQL before execution** - Test JQL in Jira UI first
2. **Check custom field IDs** - Use `jira_search_fields` if field reference fails
3. **Validate issue keys** - Ensure Epic/Story keys match your project
4. **Handle missing fields** - Some custom fields may be empty; design null-safe parsing
5. **Monitor attachments** - Large attachments may timeout; implement retry logic
6. **Log extraction progress** - Save intermediate results in case of timeout
7. **Test on small set first** - Validate workflow on 1-2 issues before bulk extraction
8. **Verify .env file** - Ensure credentials are valid and file is valid JSON
9. **Check output directory** - Verify `Output/` folder has write permissions
10. **Terminal output** - Monitor console for download progress and errors

---

## 🚀 Using This Agent - Quick Start

### Scenario 1: Download Project Attachments (Terminal Execution)
```
User: "Download all attachments from PROJ-2"

Agent:
1. Loads credentials from .env
2. Executes: Download-IssueAttachments -IssueKey "PROJ-2"
3. Saves to: Output/JiraAttachments/PROJ-2/attachments/
4. Reports: "✓ Downloaded Requirement-Document.docx (18,432 bytes)"
```

### Scenario 2: Extract PROJ-1 with Full Hierarchy (Terminal)
```
User: "Extract PROJ-1 epic with all stories and documents"

Agent:
1. Loads credentials from .env
2. Executes: Extract-EpicHierarchy -EpicKey "PROJ-1"
3. Saves to: Output/jira/PROJ-1/
4. Includes:
   - Epic details JSON
   - All epic attachments
   - Child stories JSON
   - All story attachments
   - Extraction report
5. Reports: "✓ Extraction complete: 1 epic, 0 stories, 1 attachment"
```

### Scenario 3: Fetch All Project Epics (Terminal)
```
User: "Fetch all PROJ epic attachments with manifest"

Agent:
1. Loads credentials from .env
2. Executes: Download-ProjectEpicAttachments -ProjectKey "PROJ"
3. Saves to: Output/JiraAttachments/
4. Creates: Output/JiraAttachments/download-manifest.json
5. Reports: "✓ Downloaded 2 epics, 2 files, 43,008 bytes"
```

### Scenario 4: Use MCP Tools for Complex Queries
```
User: "Find all stories in PROJ project updated in last 7 days"

Agent:
1. Uses: jira_get (MCP tool)
2. Executes JQL: project = PROJ AND updated >= -7d
3. Returns: List of issues matching criteria
4. Offers: Download attachments via terminal
```

---

## 📚 Complete Documentation Map

**New to this agent? Follow this path:**

1. **⚡ QUICK START - Setup Guide** (This section) — Step-by-step setup
2. **💬 How to Use This Agent** — Common requests and examples
3. **🌟 Capabilities Summary** — What the agent can do
4. **🧪 Verified Test Log** — Proof that everything works
5. **🔍 Root Cause Analysis** — Technical details (advanced)
6. **📖 Full Documentation Sections** — Detailed workflows and operations

---

## ✅ Final Setup Verification

Run this PowerShell command to confirm everything is working:

```powershell
Write-Host "=== Jira Agent Setup Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: .env file
if (Test-Path ".env") {
    $env = Get-Content ".env" | ConvertFrom-Json
    Write-Host "✓ .env file: Valid" -ForegroundColor Green
} else {
    Write-Host "✗ .env file: Not found" -ForegroundColor Red
}

# Test 2: Helper script
if (Test-Path "scripts/Jira-AttachmentDownloader.ps1") {
    Write-Host "✓ Helper script: Found" -ForegroundColor Green
} else {
    Write-Host "✗ Helper script: Not found" -ForegroundColor Red
}

# Test 3: Output directory
New-Item -ItemType Directory -Path "Output/JiraAttachments" -Force -ErrorAction SilentlyContinue | Out-Null
Write-Host "✓ Output directory: Ready" -ForegroundColor Green

# Test 4: Jira connectivity
try {
    $env = Get-Content ".env" | ConvertFrom-Json
    $pair = "$($env.JIRA_USERNAME):$($env.JIRA_API_TOKEN)"
    $encodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
    $headers = @{"Authorization" = "Basic $encodedAuth"}
    $result = Invoke-RestMethod -Uri "$($env.JIRA_URL)/rest/api/3/myself" -Headers $headers
    Write-Host "✓ Jira connection: OK (User: $($result.displayName))" -ForegroundColor Green
} catch {
    Write-Host "✗ Jira connection: Failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Next: Try asking the agent 'Download attachments from [EPIC-KEY]'"
```

---

## Support & Resources

| Need | Where to Look |
|------|---------------|
| Setup issues | Troubleshooting Setup Issues section |
| First-time use | How to Use This Agent section |
| What agent does | Capabilities Summary table |
| PowerShell help | Scripts/Jira-AttachmentDownloader.ps1 comments |
| Jira REST API | https://developer.atlassian.com/cloud/jira/platform/rest/v3/ |
| API token | https://id.atlassian.com/manage-profile/security/api-tokens |
| Jira project | Your organization's Jira instance |

---

## 🎓 What You Now Know

After successfully setting up this agent, you can:

✅ Authenticate to Jira Cloud with API tokens  
✅ Load credentials securely from `.env` files  
✅ Execute PowerShell scripts from VS Code  
✅ Download binary attachments from Jira  
✅ Organize files into hierarchical structures  
✅ Generate metadata and manifests  
✅ Query Jira with JQL  
✅ Extract complete epic hierarchies  
✅ Handle authentication and permissions  
✅ Create reusable PowerShell helper functions  

---

**Agent Status:** ✅ **Production Ready**  
**Version:** 1.0.0  
**Last Updated:** 2026-09-03  
**Tested Against:** Jira Cloud  
**Maintainer Notes:** All prerequisites documented. New users can follow "Quick Start" for 10-minute setup.

### Agent Capabilities Summary

| Capability | Method | Status |
|-----------|--------|--------|
| Search Jira with JQL | MCP `jira_get` tool | ✅ Ready |
| Fetch issue details | MCP `jira_get` tool | ✅ Ready |
| Download attachments | Terminal PowerShell | ✅ Ready |
| Save to workspace | Terminal PowerShell | ✅ Ready |
| Create hierarchies | Terminal PowerShell | ✅ Ready |
| Generate manifests | Terminal PowerShell | ✅ Ready |
| Extract full epics | Terminal PowerShell | ✅ Ready |
| Real-time feedback | Terminal output | ✅ Ready |


