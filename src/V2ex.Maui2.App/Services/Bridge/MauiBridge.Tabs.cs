using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public async Task<string> GetTabTopicsAsync(string tab)
    {
        try
        {
            logger.LogInformation("Bridge: 获取 Tab 话题，Tab={Tab}", tab);
            var topics = await apiService.GetTabTopics(tab);
            return JsonSerializer.Serialize(topics, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取 Tab 话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
