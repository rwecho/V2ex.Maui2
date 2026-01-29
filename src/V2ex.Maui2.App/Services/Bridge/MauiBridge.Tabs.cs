using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public Task<string> GetTabTopicsAsync(string tab)
    {
        return ExecuteSafeAsync(() => apiService.GetTabTopics(tab));
    }
}
