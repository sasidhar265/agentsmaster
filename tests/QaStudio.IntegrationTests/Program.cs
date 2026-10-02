using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using QaStudio.Web.Models;
using QaStudio.Web.Services;

// The same C# executable doubles as a deterministic runner for subprocess tests.
// No model calls, Node.js, Python, NuGet test packages, or external services are used.
if (args.Length > 0) return await Fixture(args);
var root = FindRoot();
var workspace = Path.Combine(Path.GetTempPath(), "qa-csharp-" + Guid.NewGuid());
Directory.CreateDirectory(Path.Combine(workspace, ".github/agents"));
Directory.CreateDirectory(Path.Combine(workspace, "input"));
await File.WriteAllTextAsync(Path.Combine(workspace, ".github/agents/QA-Master.agent.md"), "Fixture agent instructions");
await File.WriteAllTextAsync(Path.Combine(workspace, ".github/agent-config.json"), """
{"version":1,"runners":{"codex":{"model":"inherit","sandbox":"workspace-write"},"copilot":{"model":"request","agents":{}}}}
""");
await File.WriteAllTextAsync(Path.Combine(workspace, "input/sample-SourcePayload.json"), "{\"identifier\":\"keep\"}");
var count = 0;
void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
    count++;
}
var appHost = Path.Combine(AppContext.BaseDirectory, "QaStudio.IntegrationTests" + (OperatingSystem.IsWindows() ? ".exe" : ""));
var configuration = new DirectoryInfo(AppContext.BaseDirectory).Parent!.Name;
var webDll = Path.Combine(root, "src/QaStudio.Web/bin", configuration, "net10.0/QaStudio.Web.dll");
var runtimeDirectory = System.Runtime.InteropServices.RuntimeEnvironment.GetRuntimeDirectory();
var dotnet = Path.GetFullPath(Path.Combine(runtimeDirectory, "../../..", OperatingSystem.IsWindows() ? "dotnet.exe" : "dotnet"));
Process? web = null;
try
{
    Check(RunCoordinator.JiraKey("gqs-1", "") == "GQS-1", "Jira key normalization");
    Check(RunCoordinator.JiraKey("https://example.test/browse/GQS-42?x=1", "") == "GQS-42", "Jira links");
    Check(RunCoordinator.JiraKey("12", "gqs") == "GQS-12", "Numeric Jira references");
    Check(DashboardService.Duration("1.02:03:04.5") == 93784.5, "TRX duration parsing");
    var usage = DashboardService.Usage(JsonNode.Parse("""{"modelMetrics":{"fixture":{"usage":{"inputTokens":100,"outputTokens":20,"cacheReadTokens":10,"cacheWriteTokens":5,"reasoningTokens":2}}}}"""));
    Check(usage["totalTokens"]!.GetValue<double>() == 120 && usage["models"]![0]!["uncachedInputTokens"]!.GetValue<double>() == 85, "Usage does not double count cache/reasoning");
    Check(DashboardService.Usage(null)["totalTokens"] is null, "Missing usage stays unknown");
    var trx = Path.Combine(workspace, "parser.trx");
    await File.WriteAllTextAsync(trx, """
    <TestRun xmlns="urn:trx"><Times start="2026-01-01T00:00:00Z" finish="2026-01-01T00:00:05Z"/>
    <TestDefinitions><UnitTest id="one" name="First"><TestMethod className="Suite"/></UnitTest><UnitTest id="two" name="Not run"/></TestDefinitions>
    <Results><UnitTestResult testId="one" testName="First" outcome="Failed" endTime="2026-01-01T00:00:01Z"><Output><ErrorInfo><Message>old failure</Message></ErrorInfo></Output></UnitTestResult>
    <UnitTestResult testId="one" testName="First" outcome="Passed" endTime="2026-01-01T00:00:05Z" duration="00:00:02"/></Results></TestRun>
    """);
    var evidence = DashboardService.ParseTrx(trx);
    Check(evidence.Tests.Count == 2 && evidence.Tests[0].Attempts == 2 && evidence.Tests[0].Status == "passed" && evidence.Tests[1].Status == "not_run" && evidence.ExecutionSeconds == 5, "Namespace-aware TRX, retries, definitions and timing");
    await File.WriteAllTextAsync(trx, "<!DOCTYPE TestRun [<!ENTITY x SYSTEM 'file:///etc/passwd'>]><TestRun>&x;</TestRun>");
    try { DashboardService.ParseTrx(trx); throw new Exception("DTD accepted"); } catch (System.Xml.XmlException) { count++; }
    var progressRun = new RunRecord { Pattern = "4", Status = "running" };
    var progress = JsonSerializer.SerializeToNode(RunProgress.Build(progressRun, "Mention SpecForge completed\nQA_PROGRESS TestCraft started\nQA_PROGRESS GherkinGenie completed\n"), RunJson.Options)!.AsArray();
    Check(progress.First(p => p!["name"]!.ToString() == "SpecForge")!["status"]!.ToString() == "pending", "Incidental mentions do not create progress");
    Check(progress.First(p => p!["name"]!.ToString() == "TestCraft")!["status"]!.ToString() == "running", "Explicit progress markers");

    var interrupted = Guid.NewGuid().ToString();
    await SaveRun(interrupted, new { id = interrupted, status = "running", pattern = "3", prompt = "Old run", createdAt = DateTimeOffset.UtcNow });
    var (process, address) = await StartWeb(); web = process;
    using var client = new HttpClient { BaseAddress = new Uri(address), Timeout = TimeSpan.FromSeconds(20) };
    async Task<JsonNode> Get(string path)
    {
        using var response = await client.GetAsync(path);
        var body = await response.Content.ReadAsStringAsync();
        Check(response.IsSuccessStatusCode, $"GET {path}: {response.StatusCode} {body}");
        return JsonNode.Parse(body)!;
    }
    async Task<JsonNode> Post(object payload, HttpStatusCode expected = HttpStatusCode.Created, string path = "/api/runs")
    {
        using var response = await client.PostAsJsonAsync(path, payload);
        var body = await response.Content.ReadAsStringAsync();
        Check(response.StatusCode == expected, $"POST {path}: expected {expected}, got {response.StatusCode}: {body}");
        return JsonNode.Parse(body)!;
    }
    async Task<JsonNode> Wait(string id, Func<JsonNode, bool>? predicate = null)
    {
        for (var i = 0; i < 200; i++)
        {
            var run = await Get("/api/runs/" + id);
            if (predicate?.Invoke(run) ?? run["finishedAt"] is not null) return run;
            await Task.Delay(30);
        }
        throw new Exception("Run did not finish: " + id);
    }
    var html = await client.GetStringAsync("/");
    foreach (var page in new[] { "generation", "execution", "data", "dashboard", "recent" }) Check(html.Contains($"id=\"{page}-page\""), "Razor page " + page);
    Check(System.Text.RegularExpressions.Regex.IsMatch(html, "data-workflow=\"4\"\\s+class=\"selected\"") && !html.Contains("<partial"), "Typed Razor Pages rendering");
    foreach (var asset in new[] { "app.js", "workflows.js", "progress.js", "dashboard.js", "costs.js", "styles.css" })
        Check((await client.GetAsync("/" + asset)).StatusCode == HttpStatusCode.OK, "Asset " + asset);
    foreach (var path in new[] { "/.env", "/server.mjs", "/.github/agents/QA-Master.agent.md", "/Pages/Index.cshtml", "/Pages/Index.cshtml.cs" })
        Check((await client.GetAsync(path)).StatusCode == HttpStatusCode.NotFound, "Private file " + path);
    using (var request = new HttpRequestMessage(HttpMethod.Get, "/api/runs"))
    {
        request.Headers.Add("Origin", "https://foreign.test");
        Check((await client.SendAsync(request)).StatusCode == HttpStatusCode.Forbidden, "Cross-origin access denied");
    }
    using (var request = new HttpRequestMessage(HttpMethod.Get, "/api/runs"))
    {
        request.Headers.Host = "foreign.test";
        Check((await client.SendAsync(request)).StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.BadRequest, "Foreign host denied");
    }
    var config = await Get("/api/config"); Check(config["runner"]!.GetValue<bool>(), "C# fixture executable available with empty PATH");
    Check((await Get("/api/runs/" + interrupted))["status"]!.ToString() == "interrupted", "Restart recovery");
    Check((await Get("/api/resources"))["payloads"]!.AsArray().Count == 1, "Shared payload discovery");
    await Post(new { pattern = "99" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "4" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "2", files = new[] { new { name = "../secret.txt", data = "YWJj" } } }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "11", baseName = "../escape", sourcePayload = "{}" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "10", sourceRun = "../../escape" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "4", files = "invalid" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "4", prompt = "Valid", files = new object?[] { null } }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "2", prompt = "Valid", provider = "copilot", model = "unsupported-model" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "2", prompt = "Valid", provider = "unknown" }, HttpStatusCode.BadRequest);

    var created = await Post(new { pattern = "3", prompt = "fixture generation", files = new[] { new { name = "requirements.txt", data = "YWJj" } } });
    var id = created["id"]!.ToString(); var completed = await Wait(id);
    Check(completed["status"]!.ToString() == "finished", "Agent fixture completes");
    Check(completed["response"]!.ToString() == "Fixture summary", "Codex final response");
    Check((await File.ReadAllTextAsync(Path.Combine(workspace, ".qa-runs", id, "workspace/input/1-requirements.txt"))) == "abc", "Uploads staged exactly");
    Check(completed["log"]!.ToString().Contains("QA_PROGRESS SpecForge completed"), "Codex event translation");
    var detail = await Get($"/api/runs/{id}/dashboard");
    Check(detail["counts"]!["not_run"]!.GetValue<int>() == 1 && detail["counts"]!["passed"]!.GetValue<int>() == 0, "Feature inventory never fabricates success");
    using (var response = await client.GetAsync($"/api/runs/{id}/artifact?path=testcraft/cases.md&download=1"))
    {
        Check(response.Content.Headers.ContentDisposition?.DispositionType == "attachment", "Download headers");
        Check(await response.Content.ReadAsStringAsync() == "# Fixture cases", "Download content");
    }
    using (var response = await client.GetAsync($"/api/runs/{id}/automation-pack"))
    {
        Check(response.Content.Headers.ContentType?.MediaType == "application/zip", "ZIP type");
        using var archive = new ZipArchive(new MemoryStream(await response.Content.ReadAsByteArrayAsync()));
        Check(archive.Entries.Any(e => e.FullName.EndsWith("AutomationFramework.csproj")), "C# ZIP export");
        Check(archive.Entries.All(e => !e.FullName.Contains("TestResults") && !e.FullName.Contains("/bin/") && !e.FullName.Contains("/.git/") && !e.FullName.Contains("/__pycache__/")), "ZIP excludes old outputs");
    }
    Check((await client.GetAsync($"/api/runs/{id}/artifact?path=../../run.json")).StatusCode == HttpStatusCode.NotFound, "Artifact traversal denied");
    Check((await client.GetAsync($"/api/runs/{id}/dashboard?report=../../run.json")).StatusCode == HttpStatusCode.BadRequest, "Report traversal denied");
    if (!OperatingSystem.IsWindows())
    {
        var linked = Path.Combine(workspace, ".qa-runs", id, "workspace/output/testcraft/private.md");
        File.CreateSymbolicLink(linked, Path.Combine(workspace, ".qa-runs", id, "run.json"));
        Check((await client.GetAsync($"/api/runs/{id}/artifact?path=testcraft/private.md")).StatusCode == HttpStatusCode.NotFound, "Artifact symlink denied");
    }
    var dataRun = await Post(new { pattern = "11", baseName = "fixture", sourcePayload = "{\"identifier\":\"preserve\"}", payloadSchema = "{\"type\":\"object\"}" });
    await Wait(dataRun["id"]!.ToString());
    Check(await File.ReadAllTextAsync(Path.Combine(workspace, ".qa-runs", dataRun["id"]!.ToString(), "workspace/input/fixture-SourcePayload.json")) == "{\"identifier\":\"preserve\"}", "Test data input preservation");
    var sharedRun = await Post(new { pattern = "11", payloadId = "sample" }); await Wait(sharedRun["id"]!.ToString());
    var slow = await Post(new { pattern = "2", prompt = "fixture-slow" });
    await Post(new { pattern = "2", prompt = "conflict" }, HttpStatusCode.Conflict);
    await Post(new { }, HttpStatusCode.OK, $"/api/runs/{slow["id"]}/cancel");
    Check((await Wait(slow["id"]!.ToString()))["status"]!.ToString() == "cancelled", "Agent cancellation");
    var quota = await Post(new { pattern = "2", prompt = "fixture-quota" });
    var quotaResult = await Wait(quota["id"]!.ToString());
    Check(quotaResult["status"]!.ToString() == "failed" && quotaResult["failure"]!["reason"]!.ToString().Contains("quota"), "Quota error does not count as success");
    var framework = Path.Combine(workspace, ".qa-runs", id, "workspace/output/bddautomator/AutomationFramework");
    await Post(new { pattern = "10", executionMode = "bdd", sourceRun = id, configuration = "Release; bad" }, HttpStatusCode.BadRequest);
    await Post(new { pattern = "10", executionMode = "bdd", sourceRun = id, testFilter = "bad\nfilter" }, HttpStatusCode.BadRequest);
    foreach (var (mode, expected) in new[] { ("pass", "finished"), ("fail", "failed"), ("empty", "blocked"), ("build-fail", "failed"), ("slow", "cancelled"), ("placeholder", "blocked") })
    {
        await File.WriteAllTextAsync(Path.Combine(framework, "appsettings.json"), JsonSerializer.Serialize(new { mode, token = mode == "placeholder" ? "REPLACE_WITH_SECRET" : "configured" }));
        const string filter = "FullyQualifiedName~Quote&Name!~$(touch injected)";
        var bdd = await Post(new { pattern = "10", executionMode = "bdd", sourceRun = id, configuration = "Debug", testFilter = filter });
        var bddId = bdd["id"]!.ToString();
        if (mode == "slow")
        {
            await Wait(bddId, r => r["stage"]?.ToString() == "testing");
            await Post(new { }, HttpStatusCode.OK, $"/api/runs/{bddId}/cancel");
        }
        var result = await Wait(bddId);
        Check(result["status"]!.ToString() == expected, $"BDD {mode}: {result["error"]}");
        Check(result["artifacts"]!.AsArray().Any(a => a!["name"]!.ToString() == "BDD-ExecutionReport.html"), "BDD HTML report " + mode);
        var metrics = await Get($"/api/runs/{bddId}/dashboard");
        Check(metrics["usage"]!["totalTokens"]!.GetValue<int>() == 0 && !metrics["usage"]!["applicable"]!.GetValue<bool>(), "BDD zero tokens");
        if (mode is "pass" or "fail")
        {
            Check(metrics["counts"]![mode == "pass" ? "passed" : "failed"]!.GetValue<int>() == 1, "TRX outcomes");
            var commandFile = Path.Combine(workspace, ".qa-runs", bddId, "workspace/output/bddautomator/AutomationFramework/fixture-commands.jsonl");
            var commands = (await File.ReadAllLinesAsync(commandFile)).Select(s => JsonSerializer.Deserialize<string[]>(s)!).ToArray();
            Check(commands.Select(c => c[0]).SequenceEqual(new[] { "--list-sdks", "restore", "build", "test" }), "BDD real process sequence");
            var testArgs = commands[^1]; Check(testArgs[Array.IndexOf(testArgs, "--filter") + 1] == filter && testArgs.Contains("Debug"), "Filter is one literal argument");
        }
        if (mode == "placeholder") Check(result["error"]!.ToString().Contains("token"), "Configuration placeholder diagnostics");
    }
    Console.WriteLine($"PASS: {count} C# assertions covering Razor Pages, validation, storage, security, runners, cancellation, reports, ZIP, and direct BDD. Host PATH contained no Node.js or Python.");
}
finally
{
    if (web is not null) { if (!web.HasExited) web.Kill(entireProcessTree: true); await web.WaitForExitAsync(); web.Dispose(); }
    Directory.Delete(workspace, true);
}
return 0;

async Task SaveRun(string id, object value)
{
    var directory = Path.Combine(workspace, ".qa-runs", id); Directory.CreateDirectory(directory);
    await File.WriteAllTextAsync(Path.Combine(directory, "run.json"), JsonSerializer.Serialize(value));
}
async Task<(Process, string)> StartWeb()
{
    var info = new ProcessStartInfo(dotnet) { WorkingDirectory = Path.Combine(root, "src/QaStudio.Web"), UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true };
    info.ArgumentList.Add(webDll);
    info.Environment["Workspace__Root"] = workspace;
    info.Environment["QA_CODEX_BIN"] = appHost;
    info.Environment["QA_DOTNET_BIN"] = appHost;
    info.Environment["QA_RUNNER"] = "codex";
    info.Environment["ASPNETCORE_URLS"] = "http://127.0.0.1:0";
    info.Environment["PATH"] = Path.Combine(workspace, "empty-path");
    var ready = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
    var log = new StringBuilder();
    var process = new Process { StartInfo = info, EnableRaisingEvents = true };
    void Line(string? line)
    {
        if (line is null) return;
        lock (log) log.AppendLine(line);
        const string marker = "Now listening on: ";
        if (line.Contains(marker)) ready.TrySetResult(line[(line.IndexOf(marker, StringComparison.Ordinal) + marker.Length)..].Trim());
    }
    process.OutputDataReceived += (_, e) => Line(e.Data); process.ErrorDataReceived += (_, e) => Line(e.Data);
    process.Exited += (_, _) => { lock (log) ready.TrySetException(new Exception("Host exited: " + log)); };
    process.Start(); process.BeginOutputReadLine(); process.BeginErrorReadLine();
    try { return (process, await ready.Task.WaitAsync(TimeSpan.FromSeconds(20))); }
    catch { if (!process.HasExited) process.Kill(entireProcessTree: true); await process.WaitForExitAsync(); process.Dispose(); throw; }
}
static string FindRoot()
{
    var directory = new DirectoryInfo(AppContext.BaseDirectory);
    while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "src/QaStudio.Web/QaStudio.Web.csproj"))) directory = directory.Parent;
    return directory?.FullName ?? throw new Exception("Workspace root not found.");
}
static async Task<int> Fixture(string[] args)
{
    if (args[0] == "--version") { Console.WriteLine("C# fixture"); return 0; }
    if (args[0] == "exec" || args[0] == "--agent")
    {
        if (args.Any(a => a.Contains("fixture-slow"))) { await Task.Delay(TimeSpan.FromMinutes(2)); return 0; }
        if (args.Any(a => a.Contains("fixture-quota"))) { Console.WriteLine("{\"type\":\"error\",\"message\":\"You hit your usage limit\"}"); return 0; }
        Directory.CreateDirectory("output/testcraft"); await File.WriteAllTextAsync("output/testcraft/cases.md", "# Fixture cases");
        Directory.CreateDirectory("output/gherkingenie"); await File.WriteAllTextAsync("output/gherkingenie/sample.feature", "Feature: Fixture\nScenario: Sample\nGiven a fixture\n");
        const string framework = "output/bddautomator/AutomationFramework";
        Directory.CreateDirectory(framework + "/Input");
        Directory.CreateDirectory(framework + "/TestResults");
        Directory.CreateDirectory(framework + "/bin");
        Directory.CreateDirectory(framework + "/.git");
        Directory.CreateDirectory(framework + "/__pycache__");
        await File.WriteAllTextAsync(framework + "/.git/config", "excluded");
        await File.WriteAllTextAsync(framework + "/__pycache__/cached", "excluded");
        await File.WriteAllTextAsync(framework + "/AutomationFramework.csproj", "<Project />");
        await File.WriteAllTextAsync(framework + "/appsettings.json", "{}");
        await File.WriteAllTextAsync(framework + "/Input/TestData.json", "{}");
        await File.WriteAllTextAsync(framework + "/TestResults/old.txt", "excluded");
        await File.WriteAllTextAsync(framework + "/bin/old.dll", "excluded");
        var summary = Array.IndexOf(args, "--output-last-message");
        if (summary >= 0) await File.WriteAllTextAsync(args[summary + 1], "Fixture summary");
        Console.WriteLine("{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":\"QA_PROGRESS SpecForge completed\"}}");
        return 0;
    }
    await File.AppendAllTextAsync("fixture-commands.jsonl", JsonSerializer.Serialize(args) + "\n");
    var mode = JsonNode.Parse(await File.ReadAllTextAsync("appsettings.json"))?["mode"]?.ToString();
    if (args[0] == "--list-sdks") { Console.WriteLine("10.0.100 [fixture]"); return 0; }
    if (args[0] == "build" && mode == "build-fail") { Console.Error.WriteLine("Fixture compiler error"); return 1; }
    if (args[0] != "test") return 0;
    if (mode == "slow") { await Task.Delay(TimeSpan.FromMinutes(2)); return 0; }
    if (mode == "empty") return 0;
    var results = args[Array.IndexOf(args, "--results-directory") + 1]; Directory.CreateDirectory(results);
    await File.WriteAllTextAsync(Path.Combine(results, "bdd.trx"), $"<TestRun><Results><UnitTestResult testId=\"fixture\" testName=\"Fixture scenario\" outcome=\"{(mode == "fail" ? "Failed" : "Passed")}\" duration=\"00:00:01\"><Output><ErrorInfo><Message>Fixture assertion &lt;detail&gt;</Message><StackTrace>Fixture stack</StackTrace></ErrorInfo></Output></UnitTestResult></Results></TestRun>");
    return mode == "fail" ? 1 : 0;
}
