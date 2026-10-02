using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using QaStudio.Web.Models;
using QaStudio.Web.Services;

namespace QaStudio.Web.Controllers;

[ApiController]
[Route("api")]
public sealed class RunApiController(WorkspaceStore store, RunCoordinator coordinator, DashboardService dashboard) : ControllerBase
{
    [HttpGet("config")]
    public async Task<IActionResult> Configuration() => Ok(await coordinator.Configuration());
    [HttpGet("resources")]
    public async Task<IActionResult> Resources() => Ok(await store.Resources());
    [HttpGet("runs")]
    public async Task<IActionResult> Runs() => Ok(await store.List());
    [HttpPost("runs")]
    public async Task<IActionResult> Create([FromBody] RunRequest request)
    {
        var run = await coordinator.Create(request);
        return Created($"/api/runs/{run.Id}", run);
    }
    [HttpGet("runs/{id}")]
    public async Task<IActionResult> Run(string id)
    {
        var run = await store.Get(id);
        var log = await store.ReadRunText(id, "activity.log");
        var response = JsonSerializer.SerializeToNode(run, RunJson.Options)!.AsObject();
        response["log"] = log;
        response["response"] = await store.ReadRunText(id, "summary.md");
        response["artifacts"] = JsonSerializer.SerializeToNode(store.Artifacts(id), RunJson.Options);
        response["failure"] = JsonSerializer.SerializeToNode(RunProgress.Failure(run, log), RunJson.Options);
        response["progress"] = JsonSerializer.SerializeToNode(RunProgress.Build(run, log), RunJson.Options);
        return Ok(response);
    }
    [HttpGet("runs/{id}/dashboard")]
    public async Task<IActionResult> Dashboard(string id, [FromQuery] string? report) => Ok(await dashboard.Build(await store.Get(id), report));
    [HttpPost("runs/{id}/cancel")]
    public async Task<IActionResult> Cancel(string id) { await coordinator.Cancel(id); return Ok(new { ok = true }); }
    [HttpGet("runs/{id}/artifact")]
    public async Task<IActionResult> Artifact(string id, [FromQuery] string path)
    {
        await store.Get(id);
        if (!store.Artifacts(id).Any(a => a.Path == path)) throw new ApiException("Artifact not found.", 404);
        var file = WorkspaceStore.SafePath(store.Output(id), path);
        var stream = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        if (Request.Query.ContainsKey("download"))
            return File(stream, "application/octet-stream", Regex.Replace(Path.GetFileName(file), @"[^\w.()-]", "_"));
        return File(stream, "text/plain; charset=utf-8");
    }
    [HttpGet("runs/{id}/automation-pack")]
    public async Task<IActionResult> AutomationPack(string id)
    {
        var run = await store.Get(id);
        if (run.Status == "running") throw new ApiException("Wait for generation to finish before downloading the automation pack.", 409);
        var files = store.Artifacts(id).Where(a => Regex.IsMatch(a.Path, "^(bddautomator|automationforge|gherkeningenie|gherkingenie)/", RegexOptions.IgnoreCase)
            && !a.Path.Split('/').Any(p => p.ToLowerInvariant() is "bin" or "obj" or "node_modules" or "testresults" or "allure-results" or ".git" or "__pycache__")).ToList();
        if (files.Count == 0) throw new ApiException("No generated automation pack is available.", 404);
        if (files.Sum(a => a.Size) > 100 * 1024 * 1024) throw new ApiException("Automation pack exceeds the 100 MB export limit.");
        var output = new MemoryStream();
        try
        {
            using (var archive = new ZipArchive(output, ZipArchiveMode.Create, true))
                foreach (var file in files)
                {
                    var entry = archive.CreateEntry(file.Path);
                    await using var destination = entry.Open();
                    await using var source = System.IO.File.OpenRead(WorkspaceStore.SafePath(store.Output(id), file.Path));
                    await source.CopyToAsync(destination, HttpContext.RequestAborted);
                }
            output.Position = 0;
            return File(output, "application/zip", $"automation-pack-{id}.zip");
        }
        catch { output.Dispose(); throw; }
    }
}
