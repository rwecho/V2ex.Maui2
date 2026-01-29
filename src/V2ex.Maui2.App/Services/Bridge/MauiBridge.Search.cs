using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public Task<string> SearchAsync(string q, int from = 0, string sort = "created")
    {
        return ExecuteSafeAsync(() => apiService.Search(q, from, sort));
    }
}
