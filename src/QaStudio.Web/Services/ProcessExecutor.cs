using System.Diagnostics;
using System.Text;

namespace QaStudio.Web.Services;

public sealed record CommandResult(int ExitCode, string Output);
public sealed class ProcessExecutor
{
    public async Task<CommandResult> Run(string executable, IEnumerable<string> arguments, string directory,
        Action<string>? stdout = null, Action<string>? stderr = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var info = new ProcessStartInfo(executable)
        {
            WorkingDirectory = directory, UseShellExecute = false,
            RedirectStandardOutput = true, RedirectStandardError = true, RedirectStandardInput = true
        };
        foreach (var argument in arguments) info.ArgumentList.Add(argument);
        info.Environment["NO_COLOR"] = "1";
        info.Environment["DOTNET_NOLOGO"] = "1";
        info.Environment["DOTNET_CLI_TELEMETRY_OPTOUT"] = "1";
        using var process = new Process { StartInfo = info };
        process.Start();
        process.StandardInput.Close();
        using var registration = cancellationToken.Register(() =>
        {
            try { if (!process.HasExited) process.Kill(entireProcessTree: true); }
            catch (InvalidOperationException) { }
        });
        var output = new StringBuilder();
        var sync = new object();
        async Task Read(StreamReader reader, Action<string>? callback)
        {
            while (await reader.ReadLineAsync() is { } line)
            {
                line += "\n";
                lock (sync)
                {
                    output.Append(line);
                    if (output.Length > 200000) output.Remove(0, output.Length - 200000);
                }
                callback?.Invoke(line);
            }
        }
        await Task.WhenAll(Read(process.StandardOutput, stdout), Read(process.StandardError, stderr), process.WaitForExitAsync());
        cancellationToken.ThrowIfCancellationRequested();
        return new(process.ExitCode, output.ToString());
    }
}
