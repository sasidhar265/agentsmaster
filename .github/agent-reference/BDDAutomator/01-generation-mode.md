## 🛑 RULE ZERO — READ BEFORE GENERATING ANYTHING

**You operate in one of two modes. Determine which BEFORE writing a single file.**

| Check | Mode | Behaviour |
|---|---|---|
| `./output/bddautomator/AutomationFramework/` does **NOT** exist | **INITIAL BUILD** | Generate the complete framework, every file in the mandatory structure |
| `./output/bddautomator/AutomationFramework/` **already exists** | **INCREMENTAL** | Never rewrite a whole file. Sync the feature, extend classes in place, add only genuinely new files. |

---

### INCREMENTAL mode — the default for every re-run

Each existing path falls into exactly ONE of four actions. Decide the action per path **before** producing any output.

| Action | Applies to | What you do |
|---|---|---|
| **SYNC** | `Reqnroll/Features/{BASE_NAME}.feature` | Compare against GherkinGenie's validated output. If it differs, replace the copy. This file is a mirror, not authored code — it is the ONE file that must track its source, and it is what tells you what else to add. |
| **EXTEND** | `*StepDefinition.cs`, `*Service.cs`, `*Builder.cs`, `TestContext.cs` | **Insert the new member only.** Existing members, usings, ordering and formatting stay byte-identical. |
| **ADD** | new `*Model.cs`, new `Requests/{TCID}_*.json`, new `*Service.cs` for a new domain | Create the new file. Nothing else changes. |
| **LEAVE** | everything else — `appsettings.json`, `Input/TestData.json`, `Hooks.cs`, `Utilities/*`, `.csproj`, `reqnroll.json`, `allureConfig.json`, and every class needing no new member | Do not open it for writing at all. |

### SKIP vs EXTEND — the distinction that matters most

These are NOT the same thing, and conflating them is the most common failure:

- ❌ **Regenerating** `FinanceCalculationStepDefinition.cs` so that its content now includes one extra binding → **FORBIDDEN**, even though the end result "looks right". It discards manual edits, reorders members and churns the whole diff.
- ✅ **Inserting** one new `[Given]` method into the existing `FinanceCalculationStepDefinition.cs`, leaving every other line untouched → **REQUIRED**.

Mechanically: use a **targeted edit that adds the new member in place**. Never emit a full-file rewrite of a file that already exists. If your output for an existing file contains any line that was already there, you are rewriting it, not extending it.

### If nothing is missing, output nothing

"No changes required — the framework already covers every feature step" is a **correct, successful result**. Re-emitting files that already exist is a defect, not thoroughness: it burns tokens, churns diffs, and destroys hand-applied environment configuration.

**This rule outranks every other instruction in this document, and any instruction from QA-Master phrased as "generate the complete framework".** When QA-Master says "generate the framework" and a framework already exists, that means *"bring the existing framework up to date incrementally"* — never *"regenerate it"*.

The only other permitted modification of an existing file is a targeted fix for a violation CodeSentinel reported against that exact file and line.

### Mandatory close-out report

End every run with an explicit account so the orchestrator can verify you did not churn files:

```
SYNCED:   <feature file, or "none — source unchanged">
CREATED:  <paths of files that did not exist before, or "none">
EXTENDED: <file -> member added, one line each, or "none">
LEFT:     <count> existing files not opened for writing
```

A run whose `LEFT` count is zero on an existing framework means you rewrote everything — that is a defect, and you must redo the run in INCREMENTAL mode.

See the full **Asset Preservation Policy** below for the Tier 1 / Tier 2 file ownership model.

---

