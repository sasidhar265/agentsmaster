using System.Text.RegularExpressions;
using System.Text.Json;

namespace QaStudio.Web.Services;

/// <summary>
/// Expands the human-maintained instruction modules into complete agent files
/// in a run workspace. Both supported CLIs then receive ordinary agent files.
/// </summary>
public static partial class AgentInstructionCompiler
{
    private const string StartMarker = "<!-- AGENT_MODULES_START -->";
    private const string EndMarker = "<!-- AGENT_MODULES_END -->";

    [GeneratedRegex(@"\[[^\]]+\]\(([^)]+\.md)\)", RegexOptions.CultureInvariant)]
    private static partial Regex ModuleLink();

    [GeneratedRegex("(?m)^name:\\s*[\\\"']?([^\\\"'\\r\\n]+)", RegexOptions.CultureInvariant)]
    private static partial Regex AgentName();

    [GeneratedRegex("(?m)^tools:\\s*.*$", RegexOptions.CultureInvariant)]
    private static partial Regex ToolsField();

    [GeneratedRegex("(?m)^model(?:Policy)?:\\s*.*\\r?\\n?", RegexOptions.CultureInvariant)]
    private static partial Regex ModelFields();

    public static readonly string[] CopilotModels = ["auto", "claude-sonnet-4.6", "claude-haiku-4.5", "gpt-5.4", "gpt-6-astra", "gpt-5.3-codex", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"];

    public static void Compile(string workspaceRoot, string provider)
    {
        var github = Path.Combine(workspaceRoot, ".github");
        var agents = Path.Combine(github, "agents");
        var references = Path.GetFullPath(Path.Combine(github, "agent-reference")) + Path.DirectorySeparatorChar;
        if (!Directory.Exists(agents)) return;

        using var config = Load(Path.Combine(github, "agent-config.json"));
        var profileSettings = config.RootElement.GetProperty("runners").GetProperty("copilot").GetProperty("agents");
        var foundProfiles = new HashSet<string>(StringComparer.Ordinal);

        foreach (var agentFile in Directory.EnumerateFiles(agents, "*.agent.md"))
        {
            var source = File.ReadAllText(agentFile);
            var frontmatterEnd = source.IndexOf("---", 3, StringComparison.Ordinal);
            if (source.StartsWith("---", StringComparison.Ordinal) && frontmatterEnd < 0)
                throw new InvalidDataException($"Missing frontmatter terminator in {Path.GetFileName(agentFile)}.");
            if (provider == "copilot")
            {
                if (frontmatterEnd < 0) throw new InvalidDataException($"Missing agent frontmatter in {Path.GetFileName(agentFile)}.");
                var frontmatter = source[..(frontmatterEnd + 3)];
                var name = AgentName().Match(frontmatter);
                if (!name.Success) throw new InvalidDataException($"Missing agent name in {Path.GetFileName(agentFile)}.");
                var id = name.Groups[1].Value.Trim();
                if (!profileSettings.TryGetProperty(id, out var profile))
                    throw new InvalidDataException($"No Copilot settings are defined for agent '{id}' in agent-config.json.");
                foundProfiles.Add(id);
                source = ApplyCopilotSettings(source, frontmatterEnd + 3, profile, id);
            }

            var start = source.IndexOf(StartMarker, StringComparison.Ordinal);
            var end = source.IndexOf(EndMarker, StringComparison.Ordinal);
            if (start < 0 && end < 0) continue; // Self-contained agent.
            if (start < 0 || end <= start)
                throw new InvalidDataException($"Invalid instruction module markers in {Path.GetFileName(agentFile)}.");

            var listStart = start + StartMarker.Length;
            var list = source[listStart..end];
            var links = ModuleLink().Matches(list).Select(match => match.Groups[1].Value).ToArray();
            var listedItems = list.Split('\n').Count(line => line.TrimStart().StartsWith("- ", StringComparison.Ordinal));
            if (links.Length == 0 || links.Length != listedItems)
                throw new InvalidDataException($"Instruction module list is empty or malformed in {Path.GetFileName(agentFile)}.");

            var modules = new List<string>(links.Length);
            foreach (var link in links)
            {
                var path = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(agentFile)!, link));
                if (!path.StartsWith(references, StringComparison.Ordinal) || !File.Exists(path))
                    throw new InvalidDataException($"Missing or invalid instruction module '{link}' in {Path.GetFileName(agentFile)}.");
                modules.Add($"<!-- Source module: {Path.GetRelativePath(github, path).Replace('\\', '/')} -->\n{File.ReadAllText(path).Trim()}\n");
            }

            var compiled = source[..start] + "## Required instructions\n\n" + string.Join("\n", modules)
                + source[(end + EndMarker.Length)..];
            File.WriteAllText(agentFile, compiled);
        }

        if (provider == "copilot")
            foreach (var profile in profileSettings.EnumerateObject())
                if (!foundProfiles.Contains(profile.Name))
                    throw new InvalidDataException($"agent-config.json defines Copilot settings for unknown agent '{profile.Name}'.");
    }

    public static JsonDocument Load(string configPath)
    {
        JsonDocument config;
        try { config = JsonDocument.Parse(File.ReadAllText(configPath)); }
        catch (Exception e) when (e is IOException or JsonException)
        { throw new InvalidDataException($"Cannot read agent configuration at {configPath}.", e); }

        try
        {
            var root = config.RootElement;
            if (root.GetProperty("version").GetInt32() != 1) throw new InvalidDataException("Unsupported agent-config.json version.");
            var runners = root.GetProperty("runners");
            var codex = runners.GetProperty("codex");
            var codexModel = codex.GetProperty("model").GetString()!;
            var sandbox = codex.GetProperty("sandbox").GetString()!;
            if (codexModel.Length == 0 || sandbox is not ("read-only" or "workspace-write"))
                throw new InvalidDataException("Codex model must be non-empty and sandbox must be read-only or workspace-write.");

            var copilot = runners.GetProperty("copilot");
            var sessionModel = copilot.GetProperty("model").GetString()!;
            if (sessionModel != "request" && !CopilotModels.Contains(sessionModel, StringComparer.Ordinal))
                throw new InvalidDataException($"Unsupported Copilot session model '{sessionModel}'.");
            foreach (var profile in copilot.GetProperty("agents").EnumerateObject())
            {
                var model = profile.Value.GetProperty("model").GetString()!;
                if (model != "inherit" && !CopilotModels.Contains(model, StringComparer.Ordinal))
                    throw new InvalidDataException($"Unsupported Copilot model '{model}' for agent '{profile.Name}'.");
                var tools = profile.Value.GetProperty("tools");
                if (tools.ValueKind != JsonValueKind.Array || !tools.EnumerateArray().Any() ||
                    tools.EnumerateArray().Any(tool => tool.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(tool.GetString())))
                    throw new InvalidDataException($"Agent '{profile.Name}' must have at least one valid Copilot tool.");
            }
            return config;
        }
        catch
        {
            config.Dispose();
            throw;
        }
    }

    public static string CodexModel(JsonDocument config) => config.RootElement.GetProperty("runners").GetProperty("codex").GetProperty("model").GetString()!;
    public static string CodexSandbox(JsonDocument config) => config.RootElement.GetProperty("runners").GetProperty("codex").GetProperty("sandbox").GetString()!;
    public static string CopilotSessionModel(JsonDocument config, string requestModel)
    {
        var value = config.RootElement.GetProperty("runners").GetProperty("copilot").GetProperty("model").GetString()!;
        return value == "request" ? requestModel : value;
    }

    private static string ApplyCopilotSettings(string source, int bodyStart, JsonElement profile, string id)
    {
        var frontmatter = source[..bodyStart];
        var tools = profile.GetProperty("tools").EnumerateArray().Select(tool => tool.GetString()!).ToArray();
        if (!ToolsField().IsMatch(frontmatter)) throw new InvalidDataException($"Missing tools field in {id}.agent.md.");
        frontmatter = ToolsField().Replace(frontmatter, "tools: " + JsonSerializer.Serialize(tools), 1);

        var model = profile.GetProperty("model").GetString()!;
        frontmatter = ModelFields().Replace(frontmatter, "");
        if (model != "inherit")
        {
            var toolsIndex = ToolsField().Match(frontmatter).Index;
            var policy = "model: " + JsonSerializer.Serialize(model) + "\nmodelPolicy: required\n";
            frontmatter = frontmatter.Insert(toolsIndex, policy);
        }
        return frontmatter + source[bodyStart..];
    }
}
