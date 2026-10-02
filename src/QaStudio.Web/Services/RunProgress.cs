using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using QaStudio.Web.Models;

namespace QaStudio.Web.Services;

public static class RunProgress
{
    public static readonly Dictionary<string, string[]> Patterns = new()
    {
        ["1"] = ["SpecForge"], ["2"] = ["SpecForge", "TestCraft", "QualitySentinel", "SheetCraft"],
        ["3"] = ["SpecForge", "GherkinGenie", "FeatureLens", "BDDAutomator", "CodeSentinel", "RunForge"],
        ["4"] = ["SpecForge", "TestCraft", "GherkinGenie", "QualitySentinel", "FeatureLens", "SheetCraft", "BDDAutomator", "CodeSentinel", "RunForge"],
        ["10"] = ["CodeSentinel", "RunForge"], ["11"] = ["TestDataForge"], ["12"] = ["DomainOutcomeValidator"]
    };
    private static readonly Dictionary<string, (string Description, string[] Tasks)> Catalog = new()
    {
        ["QA-Master"] = ("Coordinates the workflow and quality gates", ["Select the requested pattern", "Delegate specialist work", "Review outputs and blockers"]),
        ["DomainOutcomeValidator"] = ("Reviews domain specificity and business outcomes", ["Inspect source evidence and scope", "Assess measurable outcomes and requirement quality", "Report gaps and readiness without rewriting the BRD"]),
        ["JiraExtractor"] = ("Collects Jira requirements and attachments", ["Read the issue", "Extract supporting requirements"]),
        ["SpecForge"] = ("Analyzes requirements and business rules", ["Identify business rules", "Map scenarios and requirement gaps"]),
        ["TestCraft"] = ("Creates manual test cases", ["Write preconditions, steps and expected results", "Cover priority positive and negative cases"]),
        ["QualitySentinel"] = ("Reviews manual test quality", ["Check requirement coverage", "Report corrections and validation verdict"]),
        ["SheetCraft"] = ("Exports validated manual tests", ["Format validated test cases", "Publish the Excel deliverable"]),
        ["GherkinGenie"] = ("Creates BDD scenarios", ["Translate requirements into Gherkin", "Publish feature files"]),
        ["FeatureLens"] = ("Reviews BDD scenarios", ["Validate Gherkin and requirement coverage", "Report automation readiness"]),
        ["BDDAutomator"] = ("Builds the automation framework", ["Generate Reqnroll bindings and supporting code", "Configure the test project"]),
        ["CodeSentinel"] = ("Reviews generated automation", ["Validate bindings and project structure", "Check build readiness"]),
        ["RunForge"] = ("Executes automation and publishes evidence", ["Run configured tests", "Publish results and execution reports"]),
        ["TestDataForge"] = ("Generates grounded test datasets", ["Read source payload and schema", "Generate and validate test data"])
    };
    public static object? Failure(RunRecord run, string log)
    {
        var provider = run.Provider == "codex" ? "Codex" : "Copilot";
        log = Regex.Replace(log, "\u001b\\[[0-9;]*m", "");
        if (run.Status != "running" && Regex.IsMatch(log, "exceeded your monthly quota|quota.{0,30}exceeded|insufficient.{0,10}credits|hit your usage limit", RegexOptions.IgnoreCase))
            return new { reason = $"{provider} quota exceeded", detail = $"{provider} reported that this account has exceeded its available quota.", action = $"Restore available {provider} quota or sign in with an account that has capacity, then start a new run." };
        if (run.Status is not ("failed" or "blocked" or "timed_out" or "interrupted" or "cancelled")) return null;
        if (Regex.IsMatch(log, "not authenticated|authentication failed|please.{0,10}(log|sign) in", RegexOptions.IgnoreCase))
            return new { reason = $"{provider} authentication required", detail = "The runner could not authenticate.", action = $"Run {provider.ToLowerInvariant()} login in your terminal, then start a new run." };
        return new
        {
            reason = run.Status switch { "timed_out" => "Generation timed out", "cancelled" => "Run cancelled", "interrupted" => "Run interrupted", _ => "Generation could not finish" },
            detail = log.Split('\n').FirstOrDefault(line => Regex.IsMatch(line.Trim(), "failed to load|^error[: ]|^fatal[: ]", RegexOptions.IgnoreCase)) ?? run.Error ?? $"The run {run.Status}.",
            action = "Review the runner activity below for details before starting a new run."
        };
    }
    public static object[] Build(RunRecord run, string log)
    {
        if (run.ExecutionMode == "bdd") return [];
        var states = Regex.Matches(log, @"^\s*QA_PROGRESS\s+(\S+)\s+(started|completed|blocked)\s*$", RegexOptions.Multiline)
            .GroupBy(m => m.Groups[1].Value).ToDictionary(g => g.Key, g => g.Last().Groups[2].Value);
        return new[] { "QA-Master" }.Concat(run.Jira.Length > 0 ? ["JiraExtractor"] : Array.Empty<string>())
            .Concat(Patterns.GetValueOrDefault(run.Pattern) ?? []).Select(name =>
            {
                var reported = states.GetValueOrDefault(name);
                var running = run.Status == "running";
                var status = reported switch { "completed" => "completed", "blocked" => "blocked", "started" => running ? "running" : "stopped", _ => name == "QA-Master" && running ? "running" : running ? "pending" : "unconfirmed" };
                var item = Catalog.GetValueOrDefault(name, ("Workflow specialist", []));
                return (object)new { name, description = item.Item1, tasks = item.Item2, status };
            }).ToArray();
    }
    public static string CodexEvent(string line)
    {
        JsonNode? value;
        try { value = JsonNode.Parse(line); } catch { return line; }
        var item = value?["item"];
        var type = value?["type"]?.ToString();
        if (type == "item.completed" && item?["type"]?.ToString() == "agent_message") return item["text"] + "\n";
        if (item?["type"]?.ToString() == "command_execution")
            return type == "item.started" ? $"Executing: {item["command"]}\n" : type == "item.completed" ? item["aggregated_output"] + "\n" : "";
        if (type is "error" or "turn.failed") return $"Error: {value?["message"] ?? value?["error"]?["message"]}\n";
        return type == "turn.completed" ? "Codex turn completed. Review artifacts and validation reports.\n" : "";
    }
}
