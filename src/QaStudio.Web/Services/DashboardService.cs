using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using QaStudio.Web.Models;

namespace QaStudio.Web.Services;

public sealed class TestEvidence
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Suite { get; set; } = "";
    public string Status { get; set; } = "not_run";
    public string Outcome { get; set; } = "No recorded execution";
    public double? DurationSeconds { get; set; }
    public string? StartedAt { get; set; }
    public string? EndedAt { get; set; }
    public string Failure { get; set; } = "";
    public string Details { get; set; } = "";
    public string StackTrace { get; set; } = "";
    public int Attempts { get; set; }
}
public sealed class Evidence
{
    public List<TestEvidence> Tests { get; set; } = [];
    public double? ExecutionSeconds { get; set; }
    public Dictionary<string, string> ReportedCounters { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
}
public sealed class DashboardService(WorkspaceStore store)
{
    public static double? Duration(string? value)
    {
        var match = Regex.Match(value ?? "", @"^(?:(\d+)\.)?(\d+):(\d+):(\d+(?:\.\d+)?)$");
        if (!match.Success) return null;
        double Number(int i) => double.Parse(match.Groups[i].Success ? match.Groups[i].Value : "0", CultureInfo.InvariantCulture);
        return Number(1) * 86400 + Number(2) * 3600 + Number(3) * 60 + Number(4);
    }
    private static DateTimeOffset? Timestamp(string? value) => DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var date) ? date : null;
    public static Evidence ParseTrx(string path)
    {
        if (new FileInfo(path).Length > 20 * 1024 * 1024) throw new InvalidDataException("TRX exceeds the 20 MB parser limit.");
        using var reader = XmlReader.Create(path, new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null, MaxCharactersInDocument = 20 * 1024 * 1024 });
        var root = XDocument.Load(reader).Root ?? throw new InvalidDataException("Empty TRX document.");
        foreach (var node in root.DescendantsAndSelf()) node.Name = node.Name.LocalName;
        if (root.Name != "TestRun") throw new InvalidDataException("Expected a TRX TestRun document.");
        var definitions = (root.Element("TestDefinitions")?.Elements("UnitTest") ?? []).GroupBy(n => (string?)n.Attribute("id") ?? "").ToDictionary(g => g.Key, g => g.Last());
        var tests = new Dictionary<(string, string), TestEvidence>();
        var seen = new HashSet<string>();
        foreach (var node in root.Element("Results")?.Elements("UnitTestResult") ?? [])
        {
            string Attr(string name, string fallback = "") => (string?)node.Attribute(name) ?? fallback;
            string Text(string name) => node.Descendants(name).FirstOrDefault()?.Value.Trim() ?? "";
            var id = Attr("testId"); var name = Attr("testName", id.Length > 0 ? id : "Unnamed test");
            seen.Add(id);
            var raw = Attr("outcome", "Unknown");
            var status = raw.ToLowerInvariant() switch
            {
                "passed" => "passed", "failed" or "error" or "timeout" or "aborted" => "failed",
                "notexecuted" or "notrunnable" or "skipped" or "pending" or "inconclusive" => "not_run",
                "inprogress" => "running", _ => "unknown"
            };
            var key = (id, name);
            tests.TryGetValue(key, out var previous);
            var entry = new TestEvidence
            {
                Id = id.Length > 0 ? id : Attr("executionId", tests.Count.ToString()), Name = name,
                Suite = (string?)definitions.GetValueOrDefault(id)?.Element("TestMethod")?.Attribute("className") ?? "",
                Status = status, Outcome = raw, DurationSeconds = Duration(Attr("duration")),
                StartedAt = (string?)node.Attribute("startTime"), EndedAt = (string?)node.Attribute("endTime"),
                Failure = status == "failed" ? Text("Message") : "", Details = Text("Message"),
                StackTrace = Text("StackTrace"), Attempts = (previous?.Attempts ?? 0) + 1
            };
            if (previous is null || (Timestamp(entry.EndedAt) ?? DateTimeOffset.MinValue) >= (Timestamp(previous.EndedAt) ?? DateTimeOffset.MinValue)) tests[key] = entry;
            else previous.Attempts++;
        }
        foreach (var (id, definition) in definitions)
            if (!seen.Contains(id)) tests[(id, (string?)definition.Attribute("name") ?? id)] = new TestEvidence
            { Id = id, Name = (string?)definition.Attribute("name") ?? id, Outcome = "No recorded result", Details = "Defined in this TRX report, with no execution result." };
        var times = root.Element("Times");
        var start = Timestamp((string?)times?.Attribute("start")); var finish = Timestamp((string?)times?.Attribute("finish"));
        var result = new Evidence
        {
            Tests = tests.Values.ToList(), ExecutionSeconds = start.HasValue && finish.HasValue ? Math.Max(0, (finish.Value - start.Value).TotalSeconds) : null,
            ReportedCounters = root.Element("ResultSummary")?.Element("Counters")?.Attributes().ToDictionary(a => a.Name.LocalName, a => a.Value) ?? []
        };
        if (int.TryParse(result.ReportedCounters.GetValueOrDefault("total"), out var total) && total > tests.Count)
            result.Warnings.Add("TRX counters include tests without individual definitions/results. Visible totals cover identifiable tests only.");
        if (tests.Count == 0) result.Warnings.Add("This TRX report contains no identifiable test results or definitions.");
        return result;
    }
    public Evidence ReadEvidence(string id, string? report = null)
    {
        var root = store.Output(id);
        if (report is not null)
        {
            try { return ParseTrx(WorkspaceStore.SafePath(root, report)); }
            catch (Exception e) when (e is XmlException or IOException or InvalidDataException or ApiException)
            { return new Evidence { Warnings = [$"Cannot read execution evidence: {e.Message}"] }; }
        }
        var result = new Evidence();
        var framework = WorkspaceStore.SafePath(root, "bddautomator/AutomationFramework/Reqnroll/Features");
        var source = Directory.Exists(framework) ? framework : WorkspaceStore.SafePath(root, "gherkingenie");
        foreach (var file in WorkspaceStore.Walk(source).Where(f => f.EndsWith(".feature", StringComparison.OrdinalIgnoreCase)).Order())
        {
            var suite = Path.GetFileNameWithoutExtension(file); var doc = false; var index = 0;
            foreach (var line in File.ReadLines(file))
            {
                index++;
                if (Regex.IsMatch(line, "^\\s*(\"\"\"|```)")) doc = !doc;
                if (doc) continue;
                var feature = Regex.Match(line, @"^\s*Feature:\s*(.+)"); if (feature.Success) suite = feature.Groups[1].Value;
                var scenario = Regex.Match(line, @"^\s*Scenario:\s*(.+)");
                if (scenario.Success) result.Tests.Add(new TestEvidence { Id = $"{Path.GetFileName(file)}:{index}", Name = scenario.Groups[1].Value, Suite = suite, Details = "Discovered in a feature file; no TRX execution evidence is available." });
                if (Regex.IsMatch(line, @"^\s*Scenario Outline:")) result.Warnings.Add($"{Path.GetFileName(file)}: Scenario Outline examples are not counted without a TRX report.");
            }
        }
        return result;
    }
    public static JsonObject Usage(JsonNode? raw, bool direct = false)
    {
        static double? Number(JsonNode? node) => node is JsonValue value && value.TryGetValue<double>(out var number) && double.IsFinite(number) && number >= 0 ? number : null;
        var models = new JsonArray();
        if (raw?["modelMetrics"] is JsonObject metrics)
            foreach (var (model, metric) in metrics)
            {
                var usage = metric?["usage"];
                var input = Number(usage?["inputTokens"]); var read = Number(usage?["cacheReadTokens"]); var write = Number(usage?["cacheWriteTokens"]);
                var uncached = Number(metric?["tokenDetails"]?["input"]?["tokenCount"]) ?? (input >= read + write ? input - read - write : null);
                models.Add(new JsonObject { ["model"] = model, ["inputTokens"] = input, ["uncachedInputTokens"] = uncached,
                    ["outputTokens"] = Number(usage?["outputTokens"]), ["cacheReadTokens"] = read, ["cacheWriteTokens"] = write,
                    ["reasoningTokens"] = Number(usage?["reasoningTokens"]), ["requests"] = Number(metric?["requests"]?["count"]) });
            }
        var agents = new JsonArray();
        if (raw?["agentMetrics"] is JsonObject agentMetrics)
            foreach (var (agentName, agentMetric) in agentMetrics)
            {
                var agentModels = new JsonArray();
                if (agentMetric?["modelMetrics"] is JsonObject perAgentModels)
                    foreach (var (modelName, metric) in perAgentModels)
                    {
                        var usage = metric?["usage"];
                        var input = Number(usage?["inputTokens"]); var read = Number(usage?["cacheReadTokens"]); var write = Number(usage?["cacheWriteTokens"]);
                        var uncached = Number(metric?["tokenDetails"]?["input"]?["tokenCount"]) ?? (input >= read + write ? input - read - write : null);
                        agentModels.Add(new JsonObject { ["model"] = modelName, ["inputTokens"] = input, ["uncachedInputTokens"] = uncached,
                            ["outputTokens"] = Number(usage?["outputTokens"]), ["cacheReadTokens"] = read, ["cacheWriteTokens"] = write,
                            ["reasoningTokens"] = Number(usage?["reasoningTokens"]), ["requests"] = Number(metric?["requests"]?["count"]) });
                    }
                var apiMs = Number(agentMetric?["totalApiDurationMs"]) ?? Number(agentMetric?["apiDurationMs"]);
                var elapsedSeconds = Number(agentMetric?["durationSeconds"]) ?? Number(agentMetric?["elapsedSeconds"]) ??
                    (Number(agentMetric?["durationMs"]) ?? Number(agentMetric?["elapsedTimeMs"])) / 1000;
                agents.Add(new JsonObject { ["name"] = agentName == "main" ? "QA-Master" : agentName, ["models"] = agentModels,
                    ["inputTokens"] = SumModels(agentModels, "inputTokens"), ["outputTokens"] = SumModels(agentModels, "outputTokens"),
                    ["totalTokens"] = SumModels(agentModels, "inputTokens") + SumModels(agentModels, "outputTokens"),
                    ["apiDurationSeconds"] = apiMs / 1000, ["durationSeconds"] = elapsedSeconds });
            }
        double? Sum(string key) => direct ? 0 : models.Count > 0 && models.All(m => m?[key] != null) ? models.Sum(m => Number(m?[key])!.Value) : null;
        var result = new JsonObject
        {
            ["available"] = direct || models.Count > 0, ["models"] = models, ["agents"] = agents, ["inputTokens"] = Sum("inputTokens"), ["outputTokens"] = Sum("outputTokens"),
            ["totalTokens"] = Sum("inputTokens") + Sum("outputTokens"), ["cacheReadTokens"] = Sum("cacheReadTokens"), ["cacheWriteTokens"] = Sum("cacheWriteTokens"),
            ["apiDurationSeconds"] = direct ? 0 : Number(raw?["totalApiDurationMs"]) / 1000,
            ["premiumRequestUnits"] = Number(raw?["totalPremiumRequestCost"]), ["nanoAiUnits"] = Number(raw?["totalNanoAiu"]),
            ["source"] = direct ? "Direct .NET execution; no AI agent or model calls." : "Copilot session usage.json; session totals include agent work and are not attributed to individual test cases."
        };
        if (direct) result["applicable"] = false;
        return result;
    }
    private static double? SumModels(JsonArray models, string key) => models.Count > 0 && models.All(m => m?[key] is JsonValue)
        ? models.Sum(m => m![key]!.GetValue<double>()) : null;
    public async Task<JsonObject> Build(RunRecord run, string? requestedReport = null)
    {
        var reports = store.Artifacts(run.Id).Where(a => a.Path.EndsWith(".trx", StringComparison.OrdinalIgnoreCase))
            .Select(a => new { a.Path, a.Name, a.Size, ModifiedAt = File.GetLastWriteTimeUtc(WorkspaceStore.SafePath(store.Output(run.Id), a.Path)) })
            .OrderByDescending(a => a.ModifiedAt).ToList();
        var report = string.IsNullOrEmpty(requestedReport) ? reports.FirstOrDefault() : reports.FirstOrDefault(r => r.Path == requestedReport) ?? throw new ApiException("Execution report not found in this run.");
        var evidence = ReadEvidence(run.Id, report?.Path);
        JsonNode? usage = null;
        try
        {
            var file = WorkspaceStore.SafePath(store.RunDirectory(run.Id), "usage.json");
            if (File.Exists(file) && new FileInfo(file).Length < 5 * 1024 * 1024) usage = JsonNode.Parse(await File.ReadAllTextAsync(file));
        }
        catch (Exception e) when (e is IOException or JsonException or ApiException) { }
        var counts = new Dictionary<string, int> { ["total"] = evidence.Tests.Count, ["passed"] = 0, ["failed"] = 0, ["not_run"] = 0, ["running"] = 0, ["unknown"] = 0 };
        foreach (var test in evidence.Tests) counts[test.Status]++;
        var durations = evidence.Tests.Where(t => t.DurationSeconds.HasValue).Select(t => t.DurationSeconds!.Value).ToList();
        var end = run.FinishedAt ?? (run.Status == "running" ? DateTimeOffset.UtcNow : (DateTimeOffset?)null);
        string activity = "";
        try { activity = await File.ReadAllTextAsync(WorkspaceStore.SafePath(store.RunDirectory(run.Id), "activity.log")); }
        catch (Exception e) when (e is IOException or ApiException) { }
        var agentProgress = JsonSerializer.SerializeToNode(RunProgress.Build(run, activity), RunJson.Options)!.AsArray();
        var agentFolders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["JiraExtractor"] = "jira", ["SpecForge"] = "specforge", ["DomainOutcomeValidator"] = "domainoutcomevalidator",
            ["TestCraft"] = "testcraft", ["QualitySentinel"] = "qualitysentinel", ["SheetCraft"] = "sheetcraft",
            ["GherkinGenie"] = "gherkingenie", ["FeatureLens"] = "featurelense", ["BDDAutomator"] = "bddautomator",
            ["CodeSentinel"] = "codesentinel", ["RunForge"] = "runforge", ["TestDataForge"] = "testdataforge"
        };
        var artifacts = store.Artifacts(run.Id);
        foreach (var agent in agentProgress)
            if (agent is JsonObject item && agentFolders.TryGetValue(item["name"]?.ToString() ?? "", out var folder))
            {
                var agentArtifacts = artifacts.Where(artifact => artifact.Path.StartsWith(folder + "/", StringComparison.OrdinalIgnoreCase)).ToList();
                item["artifactCount"] = agentArtifacts.Count;
                if (item["name"]?.ToString() is "DomainOutcomeValidator" or "QualitySentinel" or "FeatureLens" or "CodeSentinel" or "RunForge")
                {
                    foreach (var artifact in agentArtifacts.Where(a => a.Path.EndsWith(".md", StringComparison.OrdinalIgnoreCase)))
                    {
                        try
                        {
                            var path = WorkspaceStore.SafePath(store.Output(run.Id), artifact.Path);
                            var reportText = await File.ReadAllTextAsync(path);
                            var verdictLine = Regex.Match(reportText, @"(?im)^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:Quality Gate Result|Verdict|Gate Result)(?:\*\*)?\s*:?\s*(.*)$");
                            if (!verdictLine.Success) continue;
                            var value = verdictLine.Groups[1].Value.Trim();
                            if (value.Length == 0)
                                value = reportText[(verdictLine.Index + verdictLine.Length)..].Split('\n').FirstOrDefault(line => !string.IsNullOrWhiteSpace(line))?.Trim() ?? "";
                            if (value.Contains('|')) continue;
                            var found = Regex.Match(value, @"^(?:[^\p{L}\p{N}]*\s*)?(BUILD FAILED|NEEDS-IMPROVEMENT|PASS|FAIL|BLOCKED)\b", RegexOptions.IgnoreCase);
                            if (found.Success) { item["qualityVerdict"] = found.Groups[1].Value.ToUpperInvariant(); break; }
                        }
                        catch (Exception e) when (e is IOException or ApiException) { }
                    }
                }
            }
        try
        {
            var timingPath = WorkspaceStore.SafePath(store.RunDirectory(run.Id), "agent-timing.jsonl");
            var starts = new Dictionary<string, DateTimeOffset>(StringComparer.Ordinal);
            foreach (var line in await File.ReadAllLinesAsync(timingPath))
            {
                try
                {
                    var entry = JsonNode.Parse(line)!; var name = entry["name"]!.GetValue<string>();
                    var status = entry["status"]!.GetValue<string>(); var at = DateTimeOffset.Parse(entry["at"]!.GetValue<string>(), CultureInfo.InvariantCulture);
                    if (status == "started") starts[name] = at;
                    else if (status is "completed" or "blocked" && starts.Remove(name, out var start))
                    {
                        var agent = agentProgress.FirstOrDefault(a => a?["name"]?.ToString() == name);
                        if (agent is not null) agent["durationSeconds"] = Math.Max(0, (at - start).TotalSeconds);
                    }
                }
                catch (Exception e) when (e is JsonException or FormatException or InvalidOperationException or NullReferenceException) { }
            }
        }
        catch (Exception e) when (e is IOException or ApiException) { }
        return JsonSerializer.SerializeToNode(new
        {
            run = new { run.Id, run.Status, run.CreatedAt, run.FinishedAt, label = run.Jira.Length > 0 ? run.Jira : run.Prompt, run.Error, executionMode = run.ExecutionMode ?? "agent", run.Stage },
            evidence.Tests, evidence.ExecutionSeconds, evidence.ReportedCounters, evidence.Warnings, counts,
            passRate = counts["passed"] + counts["failed"] > 0 ? 100.0 * counts["passed"] / (counts["passed"] + counts["failed"]) : (double?)null,
            completionRate = counts["total"] > 0 ? 100.0 * (counts["passed"] + counts["failed"]) / counts["total"] : (double?)null,
            wallSeconds = end.HasValue ? Math.Max(0, (end.Value - run.CreatedAt).TotalSeconds) : (double?)null,
            testSeconds = durations.Count > 0 ? durations.Sum() : (double?)null,
            averageTestSeconds = durations.Count > 0 ? durations.Average() : (double?)null,
            reports, selectedReport = report?.Path, evidenceSource = report is null ? "Feature inventory — no recorded execution" : "TRX report",
            agents = agentProgress, usage = Usage(usage, run.ExecutionMode == "bdd")
        }, RunJson.Options)!.AsObject();
    }
}
