using System.Text.Json;

namespace QaStudio.Web.Models;

public sealed class RunRequest
{
    public string? Provider { get; set; }
    public string? Model { get; set; }
    public string Pattern { get; set; } = "";
    public string Prompt { get; set; } = "";
    public string Jira { get; set; } = "";
    public string Project { get; set; } = "";
    public List<RunUpload> Files { get; set; } = [];
    public string? SourceRun { get; set; }
    public string ExecutionMode { get; set; } = "agent";
    public string Configuration { get; set; } = "Release";
    public string TestFilter { get; set; } = "";
    public string? SourcePayload { get; set; }
    public string? PayloadSchema { get; set; }
    public string? BaseName { get; set; }
    public string? PayloadId { get; set; }
}
public sealed record RunUpload(string Name, string Data);
public sealed class RunRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Provider { get; set; } = "codex";
    public string? Model { get; set; }
    public string Prompt { get; set; } = "";
    public string Jira { get; set; } = "";
    public string Pattern { get; set; } = "";
    public string Status { get; set; } = "running";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FinishedAt { get; set; }
    public string[] Files { get; set; } = [];
    public string? SourceRun { get; set; }
    public string? ExecutionMode { get; set; }
    public string? Configuration { get; set; }
    public string? TestFilter { get; set; }
    public string? BaseName { get; set; }
    public string? PayloadId { get; set; }
    public string? Stage { get; set; }
    public string? Verdict { get; set; }
    public int? TestExitCode { get; set; }
    public string? Error { get; set; }
}
public sealed record Artifact(string Path, string Name, long Size);
public sealed record ResourceOption(string Id, string Label);
public sealed record WorkspaceResources(List<ResourceOption> Frameworks, List<ResourceOption> Payloads);
public sealed class ApiException(string message, int status = 400) : Exception(message)
{
    public int Status { get; } = status;
}
public static class RunJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);
}
