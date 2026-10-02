using Microsoft.AspNetCore.Mvc.RazorPages;
using QaStudio.Web.Models;

namespace QaStudio.Web.Pages;

public sealed class IndexModel : PageModel
{
    public WorkspaceViewModel Workspace { get; } = new();

    public void OnGet() { }
}
