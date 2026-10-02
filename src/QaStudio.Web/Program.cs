using QaStudio.Web.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["Urls"] ?? "http://127.0.0.1:3000");
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 30 * 1024 * 1024);
builder.Services.AddRazorPages();
builder.Services.AddControllers();
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
    options.InvalidModelStateResponseFactory = context => new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
        new { error = "Invalid request. Check field types and required values." }));
builder.Services.AddSingleton<WorkspaceStore>();
builder.Services.AddSingleton<ProcessExecutor>();
builder.Services.AddSingleton<DashboardService>();
builder.Services.AddSingleton<RunCoordinator>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<RunCoordinator>());
var app = builder.Build();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'";
    context.Response.Headers.CacheControl = "no-store";
    var host = context.Request.Host.Host;
    var origin = context.Request.Headers.Origin.ToString();
    if ((host != "localhost" && host != "127.0.0.1") ||
        (origin.Length > 0 && origin != $"{context.Request.Scheme}://{context.Request.Host}"))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { error = "Local same-origin access only" });
        return;
    }
    try { await next(); }
    catch (QaStudio.Web.Models.ApiException error)
    {
        if (context.Response.HasStarted) { context.Abort(); return; }
        context.Response.StatusCode = error.Status;
        await context.Response.WriteAsJsonAsync(new { error = error.Message });
    }
    catch (Exception error) when (error is IOException or System.Text.Json.JsonException)
    {
        app.Logger.LogWarning(error, "Cannot read workspace data");
        if (context.Response.HasStarted) { context.Abort(); return; }
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(new { error = "Workspace data could not be read or saved. Check the application log." });
    }
});
app.UseStaticFiles();
app.MapRazorPages();
app.MapControllers();
app.Run();
