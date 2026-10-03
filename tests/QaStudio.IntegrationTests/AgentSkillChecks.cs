using QaStudio.Web.Services;

internal static class AgentSkillChecks
{
    public static void Run(string repository, Action<bool, string> check)
    {
        var temporary = Path.Combine(Path.GetTempPath(), "qa-skills-" + Guid.NewGuid());
        Directory.CreateDirectory(temporary);
        try
        {
            foreach (var provider in new[] { "codex", "copilot" })
            {
                var workspace = Path.Combine(temporary, provider);
                WorkspaceStore.CopyDirectory(Path.Combine(repository, ".github"), Path.Combine(workspace, ".github"));
                var agents = Directory.GetFiles(Path.Combine(workspace, ".github/agents"), "*.agent.md");
                var originals = agents.ToDictionary(path => path, File.ReadAllText);
                AgentInstructionCompiler.Compile(workspace, provider);
                check(agents.Length == 14, $"{provider}: all agents compile through skills");
                foreach (var agent in agents)
                {
                    var compiled = File.ReadAllText(agent);
                    check(compiled.Contains("<!-- Source module: skills/") && !compiled.Contains("AGENT_MODULES_START"),
                        $"{provider}: skill is inline in {Path.GetFileName(agent)}");
                    var skillMarker = "<!-- Source module: ";
                    var skillStart = compiled.IndexOf(skillMarker, StringComparison.Ordinal) + skillMarker.Length;
                    var skillRelative = compiled[skillStart..compiled.IndexOf(" -->", skillStart, StringComparison.Ordinal)];
                    var skillSource = File.ReadAllText(Path.Combine(workspace, ".github", skillRelative));
                    var skillHeader = skillSource[..(skillSource.IndexOf("\n---", 4, StringComparison.Ordinal) + 4)];
                    check(!compiled.Contains(skillHeader, StringComparison.Ordinal),
                        $"{provider}: skill metadata does not leak into agent frontmatter");
                    if (skillSource.Contains("<!-- AGENT_MODULES_START -->", StringComparison.Ordinal))
                    {
                        var required = skillSource.Split("<!-- AGENT_MODULES_START -->")[1].Split("<!-- AGENT_MODULES_END -->")[0];
                        foreach (System.Text.RegularExpressions.Match link in System.Text.RegularExpressions.Regex.Matches(required, @"\[[^\]]+\]\(([^)]+\.md)\)"))
                        {
                            var reference = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(Path.Combine(workspace, ".github", skillRelative))!, link.Groups[1].Value));
                            check(compiled.Contains(File.ReadAllText(reference).Trim()),
                                $"{provider}: {Path.GetFileName(agent)} retains {Path.GetFileName(reference)}");
                        }
                    }
                    if (Path.GetFileName(agent) != "AutomationForge.agent.md")
                        check(compiled.Contains(File.ReadAllText(Path.Combine(workspace, ".github/agent-reference/GENAI-QUALITY.md")).Trim()),
                            $"{provider}: shared grounding policy is preserved");
                    check(File.ReadAllText(Path.Combine(repository, ".github/agents", Path.GetFileName(agent))) == originals[agent],
                        $"{provider}: compilation does not modify maintained source");
                }
                var bdd = File.ReadAllText(Path.Combine(workspace, ".github/agents/BDDAutomator.agent.md"));
                foreach (var reference in Directory.GetFiles(Path.Combine(workspace, ".github/agent-reference/BDDAutomator"), "*.md"))
                    check(bdd.Contains(File.ReadAllText(reference).Trim()), $"{provider}: BDD contract {Path.GetFileName(reference)} retained");
                var jira = File.ReadAllText(Path.Combine(workspace, ".github/agents/jira.agent.md"));
                check(jira.Contains(File.ReadAllText(Path.Combine(workspace, ".github/agent-reference/jira/01-extraction-workflow.md")).Trim()),
                    $"{provider}: Jira extraction details retained");
                var beforeRepeat = agents.ToDictionary(path => path, File.ReadAllText);
                AgentInstructionCompiler.Compile(workspace, provider);
                check(agents.All(path => File.ReadAllText(path) == beforeRepeat[path]), $"{provider}: repeated compilation is stable");
            }

            void Reject(string name, string skillBody, string expected, Action<string>? configure = null)
            {
                var workspace = Path.Combine(temporary, name);
                Directory.CreateDirectory(Path.Combine(workspace, ".github/agents"));
                Directory.CreateDirectory(Path.Combine(workspace, ".github/skills/check"));
                Directory.CreateDirectory(Path.Combine(workspace, ".github/agent-reference"));
                File.WriteAllText(Path.Combine(workspace, ".github/agent-config.json"),
                    """{"version":1,"runners":{"codex":{"model":"inherit","sandbox":"workspace-write"},"copilot":{"model":"request","agents":{}}}}""");
                var agent = Path.Combine(workspace, ".github/agents/check.agent.md");
                var original = "<!-- AGENT_MODULES_START -->\n- [Procedure](../skills/check/SKILL.md)\n<!-- AGENT_MODULES_END -->";
                File.WriteAllText(agent, original);
                File.WriteAllText(Path.Combine(workspace, ".github/skills/check/SKILL.md"), skillBody);
                configure?.Invoke(workspace);
                try
                {
                    AgentInstructionCompiler.Compile(workspace, "codex");
                    check(false, name + ": invalid nested skill accepted");
                }
                catch (InvalidDataException error)
                {
                    check(error.Message.Contains(expected, StringComparison.OrdinalIgnoreCase), name + ": meaningful failure");
                    check(File.ReadAllText(agent) == original, name + ": failed agent remains uncompiled");
                }
            }
            const string header = "---\nname: check\ndescription: fixture\n---\n";
            static string Modules(string link) => "<!-- AGENT_MODULES_START -->\n- [Required](" + link + ")\n<!-- AGENT_MODULES_END -->";
            Reject("missing-reference", header + Modules("../../agent-reference/missing.md"), "Missing or invalid");
            Reject("circular-reference", header + Modules("SKILL.md"), "Circular");
            Reject("escaped-reference", header + Modules("../../../outside.md"), "Missing or invalid",
                w => File.WriteAllText(Path.Combine(w, "outside.md"), "Outside instruction roots"));
            Reject("agent-backlink", header + Modules("../../agents/check.agent.md"), "Missing or invalid");
            Reject("missing-header", "Skill without frontmatter", "frontmatter");
            Reject("broken-markers", header + "<!-- AGENT_MODULES_START -->", "markers");
            Reject("empty-modules", header + "<!-- AGENT_MODULES_START -->\n<!-- AGENT_MODULES_END -->", "empty or malformed");
            Reject("duplicate-blocks", header + Modules("../../agent-reference/one.md") + Modules("../../agent-reference/one.md"), "markers");
            Reject("linked-reference", header + Modules("../../agent-reference/link.md"), "Invalid instruction path", w =>
            {
                var outside = Path.Combine(w, "outside.md");
                File.WriteAllText(outside, "Outside instruction roots");
                File.CreateSymbolicLink(Path.Combine(w, ".github/agent-reference/link.md"), outside);
            });
        }
        finally { Directory.Delete(temporary, recursive: true); }
    }
}
