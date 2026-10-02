using System.Text.Json;
using QaStudio.Web.Models;

namespace QaStudio.Web.Services;

public sealed class WorkspaceStore
{
    public string Root { get; }
    public string Runs { get; }
    public WorkspaceStore(IConfiguration configuration, IWebHostEnvironment environment)
    {
        Root = Path.GetFullPath(configuration["Workspace:Root"] ?? Path.Combine(environment.ContentRootPath, "../.."));
        if (!Directory.Exists(Path.Combine(Root, ".github")))
            throw new InvalidOperationException("Set Workspace:Root to the Demo workspace containing .github and input.");
        Runs = SafePath(Root, ".qa-runs");
        Directory.CreateDirectory(Runs);
    }

    // Reject links at every component, including parent directories, before reading private run data.
    public static string SafePath(string root, string relative)
    {
        var full = Path.GetFullPath(Path.Combine(root, relative));
        var prefix = Path.TrimEndingDirectorySeparator(Path.GetFullPath(root)) + Path.DirectorySeparatorChar;
        if (!full.StartsWith(prefix, StringComparison.Ordinal)) throw new ApiException("Invalid file path.");
        var current = Path.TrimEndingDirectorySeparator(root);
        foreach (var part in Path.GetRelativePath(root, full).Split(Path.DirectorySeparatorChar))
        {
            current = Path.Combine(current, part);
            if (File.Exists(current) || Directory.Exists(current))
                if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                    throw new ApiException("Symbolic links are not supported for workspace files.");
        }
        return full;
    }
    public string RunDirectory(string id)
    {
        if (!Guid.TryParseExact(id, "D", out _)) throw new ApiException("Unknown run.");
        return SafePath(Runs, id);
    }
    public string Output(string id) => SafePath(RunDirectory(id), "workspace/output");
    public async Task<RunRecord> Get(string id)
    {
        var file = SafePath(RunDirectory(id), "run.json");
        if (!File.Exists(file)) throw new ApiException("Run not found.");
        var run = JsonSerializer.Deserialize<RunRecord>(await File.ReadAllTextAsync(file), RunJson.Options)
            ?? throw new ApiException("Invalid saved run.");
        if (run.Id != id) throw new ApiException("Invalid saved run ID.");
        return run;
    }
    public async Task<List<RunRecord>> List()
    {
        var runs = new List<RunRecord>();
        foreach (var directory in Directory.EnumerateDirectories(Runs))
        {
            try { runs.Add(await Get(Path.GetFileName(directory))); }
            catch (Exception e) when (e is ApiException or IOException or JsonException) { }
        }
        return runs.OrderByDescending(r => r.CreatedAt).ToList();
    }
    public async Task Save(RunRecord run)
    {
        var directory = RunDirectory(run.Id);
        Directory.CreateDirectory(directory);
        var destination = SafePath(directory, "run.json");
        var temporary = destination + "." + Guid.NewGuid() + ".tmp";
        await File.WriteAllTextAsync(temporary, JsonSerializer.Serialize(run, RunJson.Options));
        File.Move(temporary, destination, true);
    }
    public List<Artifact> Artifacts(string id)
    {
        var root = Output(id);
        return Walk(root).Select(file => new Artifact(Path.GetRelativePath(root, file).Replace('\\', '/'),
            Path.GetFileName(file), new FileInfo(file).Length)).ToList();
    }
    public static IEnumerable<string> Walk(string root)
    {
        if (!Directory.Exists(root)) yield break;
        foreach (var entry in Directory.EnumerateFileSystemEntries(root))
        {
            var attributes = File.GetAttributes(entry);
            if ((attributes & FileAttributes.ReparsePoint) != 0) continue;
            if ((attributes & FileAttributes.Directory) != 0)
            {
                if (Path.GetFileName(entry) is "bin" or "obj" or "node_modules") continue;
                foreach (var file in Walk(entry)) yield return file;
            }
            else yield return entry;
        }
    }
    public async Task<WorkspaceResources> Resources()
    {
        var frameworks = new List<ResourceOption>();
        var candidates = new List<(string Id, string Label, string Root)> { ("workspace", "Workspace framework", Root) };
        candidates.AddRange((await List()).Where(r => r.Status != "running").Select(r =>
            (r.Id, $"{(r.Jira.Length > 0 ? r.Jira : r.Prompt.Length > 0 ? r.Prompt[..Math.Min(45, r.Prompt.Length)] : "Automation")} · {r.CreatedAt:yyyy-MM-dd}", SafePath(RunDirectory(r.Id), "workspace"))));
        foreach (var candidate in candidates)
        {
            try
            {
                if (File.Exists(SafePath(candidate.Root, "output/bddautomator/AutomationFramework/AutomationFramework.csproj")))
                    frameworks.Add(new(candidate.Id, candidate.Label));
            }
            catch (ApiException) { }
        }
        var input = SafePath(Root, "input");
        var payloads = Walk(input).Where(f => Path.GetDirectoryName(f) == input &&
            System.Text.RegularExpressions.Regex.IsMatch(Path.GetFileName(f), @"^[\w.-]+-SourcePayload\.json$"))
            .Select(f => new ResourceOption(Path.GetFileName(f).Replace("-SourcePayload.json", ""), Path.GetFileName(f))).ToList();
        return new(frameworks, payloads);
    }
    public static void CopyDirectory(string source, string destination)
    {
        if (!Directory.Exists(source)) return;
        if ((File.GetAttributes(source) & FileAttributes.ReparsePoint) != 0) return;
        Directory.CreateDirectory(destination);
        foreach (var entry in Directory.EnumerateFileSystemEntries(source))
        {
            var attributes = File.GetAttributes(entry);
            if ((attributes & FileAttributes.ReparsePoint) != 0) continue;
            var name = Path.GetFileName(entry);
            if (name is "bin" or "obj" or "TestResults" or "allure-results" or "node_modules") continue;
            var target = Path.Combine(destination, name);
            if ((attributes & FileAttributes.Directory) != 0) CopyDirectory(entry, target);
            else File.Copy(entry, target, true);
        }
    }
    public async Task<string> ReadRunText(string id, string filename)
    {
        var file = SafePath(RunDirectory(id), filename);
        return File.Exists(file) ? await File.ReadAllTextAsync(file) : "";
    }
}
