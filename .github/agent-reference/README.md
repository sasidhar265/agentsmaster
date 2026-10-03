# Agent maintenance guide

Agent entry points live in `../agents/` and own role boundaries, runner metadata, and handoffs. Procedures live in `../skills/<skill-name>/SKILL.md`; each skill owns a distinct input contract, decisions, execution procedure, and verification. Detailed standards, report formats, and examples remain in the matching reference folders below.

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

Shared quality policy: `GENAI-QUALITY.md` is a required first reference for every active skill. It governs grounding, untrusted input, privacy, tool use, verification, and honest reporting; specialist modules add domain rules.

The dependency direction is agent → skill → required references. Skills do not load agent files. Ordered required dependencies are declared inside `AGENT_MODULES_START` / `AGENT_MODULES_END` blocks. Before a run starts, QA Studio recursively assembles the skill body and required references into the staged agent definition, stripping skill frontmatter. Both supported runners receive the procedure and complete mandatory contracts in one file. Source files remain unchanged. Missing files, cycles, escaped paths, and symbolic links stop compilation.

Only `.github/skills/**/SKILL.md` and Markdown files under `.github/agent-reference/` can be required dependencies. Optional example links stay outside the required blocks and are read only when needed; they do not authorize extra actions. Jira's detailed extraction rules live in `jira/01-extraction-workflow.md`. AutomationForge remains retired; its skill routes to replacements.

## Making changes

1. Edit the agent for responsibility, permissions metadata, or handoff changes.
2. Edit its skill for input contracts, decision rules, procedure, and verification changes.
3. Edit reference modules for detailed standards, rubrics, and artifact formats. Preserve existing workflow patterns, gate thresholds, and asset ownership unless changing behavior is intended.
4. Maintain the skill's ordered required-reference block when adding or renaming a module. Keep shared quality policy first for active roles; optional examples do not replace required standards.
5. Validate skill frontmatter and local references, then run `dotnet run --project tests/QaStudio.IntegrationTests`. The suite compiles all real agents for both runners, checks mandatory contracts survive assembly, and exercises missing/circular/escaped/linked dependencies.

Required standards are still assembled in full; this redesign does not promise token savings for those contracts. Context is limited by selecting only the requested stage and loading optional examples when needed, rather than preloading all skills. Compiler changes must preserve the existing runtime metadata and sequential fallback rules.

## Agent skills

Each agent uses a procedure under `.github/skills/<skill-name>/SKILL.md`. These skills can be used directly without reading an agent definition. Different skills own different operations: framework updates, coverage audits, feature review, evidence-based execution, lossless workbook export, and source-preserving data generation. QA Studio already copies the entire `.github` tree into each run workspace, so the skills and their relative references travel with the agents.

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

To use a skill with a file-reading runner, explicitly ask it to read the relevant `SKILL.md` and follow its loading instructions. Automatic discovery depends on the runner and its configured skill locations; these repository files do not install skills globally or change runner configuration. New QA Studio runs automatically assemble the required skills into their agent definitions. Previously staged run artifacts are unchanged.

Keep role changes in the agent, procedure changes in the skill, and detailed contract changes in references. When adding or retiring an agent, maintain its skill and this mapping as well. AutomationForge's skill only routes to its replacements; the agent remains retired.
