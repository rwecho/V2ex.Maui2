using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public async Task<string> SearchAsync(string q, int from = 0, string sort = "created")
    {
        try
        {
            var result = await apiService.Search(q, from, sort);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 搜索失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
