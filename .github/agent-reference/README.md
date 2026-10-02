# Agent maintenance guide

Agent entry points live in `../agents/`. Keep their short role description and runner metadata there. Detailed policies and examples live in the matching module folder below.

Edit `../agent-config.json` to choose Copilot models and tool lists for each agent, and to choose the Codex session model and sandbox. It is the source of truth for settings applied by QA Studio. Keep every agent name in its Copilot map aligned with the `name` field in the corresponding agent file. Use `inherit` for a profile that should use its parent session's model.

| Agent | Instruction modules, in reading order |
| --- | --- |
| QA-Master | Execution and routing; inputs and fast mode; gates and artifacts |
| SpecForge | Analysis workflow; output and quality |
| TestCraft | Generation workflow; output and quality |
| QualitySentinel | Review workflow; report and quality |
| GherkinGenie | Generation workflow; output and quality |
| FeatureLens | Review workflow; report and quality |
| BDDAutomator | Generation mode; coding standards; framework layout; namespace rules; asset preservation; request artifacts; implementation workflow |
| CodeSentinel | Scope; validation rules; verdict and report |
| RunForge | Execution workflow; report and verdict |
| TestDataForge | Source and generation rules; limits and output; workflow and quality |
| SheetCraft | Capabilities and constraints; inputs and workflow; workbook contract; quality and integration; troubleshooting and checklist |
| DomainOutcomeValidator | Assessment method and report |

Shared quality policy: `GENAI-QUALITY.md` is a required first module for every active agent. It governs grounding, untrusted input, privacy, tool use, verification, and honest reporting; specialist modules add domain rules.

Each agent has a matching directory here. Numeric filename prefixes specify reading order. Edit the modules as the source of truth. Before a run starts, QA Studio expands each listed module into that agent's `.agent.md` file in the isolated run workspace. The runners therefore receive a complete agent definition in one file and don't need to follow links or remember to load extra instructions. The source entry point remains short and easy to scan.

`jira.agent.md` uses the shared GenAI policy module; its task-specific workflow stays in the entry point. Superseded `AutomationForge.agent.md` remains self-contained. The existing `bdd-framework-examples.md`, `jira-setup-and-examples.md`, and `sheetcraft-exporter-example.md` remain conditional references, loaded as their owning instructions specify.

## Making changes

1. Start at the agent entry point and locate the responsibility you need to update.
2. Edit its module as the source of truth. Preserve complete templates, tables, and code fences.
3. Keep agent names, frontmatter, workflow patterns, output paths, quality thresholds, and preservation rules stable unless a behavior change is intended.
4. When adding or renaming a module, update the entry point's ordered list inside the `AGENT_MODULES_START` and `AGENT_MODULES_END` markers. Keep each list item as a Markdown link to a local `.md` file; the app checks the markers and paths when staging a run and stops with a clear error if they are invalid.
5. Keep required policies in the required module list; moving a policy into an optional example can change behavior.

Every active agent also loads `GENAI-QUALITY.md`. Keep its grounding, untrusted-input, privacy, verification, and honest-reporting requirements in force across all patterns. Update the relevant specialist module as well when a rule needs domain-specific detail.

The module split preserves the original instruction text and order. Runtime assembly keeps the complete instructions visible to both supported runners. A new AI runner should use the same assembled files or add an equivalent loader before it is considered supported.

## Agent skills

Each agent has a reusable entry point under `.github/skills/<skill-name>/SKILL.md`. These skills load the existing agent definition and its required instruction modules rather than duplicating workflow policies. QA Studio already copies the entire `.github` tree into each run workspace, so the skills and their relative references travel with the agents.

| Agent | Skill |
| --- | --- |
| QA-Master | [qa-master](../skills/qa-master/SKILL.md) |
| SpecForge | [specforge](../skills/specforge/SKILL.md) |
| TestCraft | [testcraft](../skills/testcraft/SKILL.md) |
| QualitySentinel | [qualitysentinel](../skills/qualitysentinel/SKILL.md) |
| GherkinGenie | [gherkingenie](../skills/gherkingenie/SKILL.md) |
| FeatureLens | [featurelens](../skills/featurelens/SKILL.md) |
| BDDAutomator | [bddautomator](../skills/bddautomator/SKILL.md) |
| CodeSentinel | [codesentinel](../skills/codesentinel/SKILL.md) |
| RunForge | [runforge](../skills/runforge/SKILL.md) |
| TestDataForge | [testdataforge](../skills/testdataforge/SKILL.md) |
| SheetCraft | [sheetcraft](../skills/sheetcraft/SKILL.md) |
| DomainOutcomeValidator | [domainoutcomevalidator](../skills/domainoutcomevalidator/SKILL.md) |
| jira-agent / JiraExtractor | [jira-agent](../skills/jira-agent/SKILL.md) |
| AutomationForge | [automationforge](../skills/automationforge/SKILL.md) |

To use a skill with a file-reading runner, explicitly ask it to read the relevant `SKILL.md` and follow its loading instructions. Automatic discovery depends on the runner and its configured skill locations; these repository files do not install skills globally or change runner configuration. Existing QA Studio runs continue to use the compiled agent definitions.

When changing a role, edit its existing agent definition or instruction modules. Update the skill description and routing guidance if its responsibility changes. When adding or retiring an agent, maintain its skill and this mapping as well. AutomationForge's skill only routes to its replacements; the agent remains retired.
