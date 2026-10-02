namespace QaStudio.Web.Models;

public sealed record WorkflowOption(string Pattern, string Icon, string Name, string Description);

public sealed class WorkspaceViewModel
{
    public string Title => "Auto Finance QA Studio";
    public string SelectedPattern => "4";
    public IReadOnlyList<WorkflowOption> Workflows { get; } =
    [
        new("2", "▤", "Finance test cases", "Journeys + controls"),
        new("3", "⌘", "Finance automation", "BDD + API framework"),
        new("4", "✧", "End-to-end coverage", "Customer + dealer journeys"),
        new("12", "◎", "BRD outcome review", "Domain fit + measurable outcomes")
    ];
}
