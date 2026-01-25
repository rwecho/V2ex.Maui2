using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public async Task<string> GetUserProfileAsync(string username)
    {
        try
        {
            logger.LogInformation("Bridge: 获取用户信息，参数: {Username}", username);
            var user = await apiService.GetMemberInfo(username);
            return JsonSerializer.Serialize(user, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取用户信息失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
    
    public async Task<string> GetUserPageAsync(string username)
    {
         try
        {
            logger.LogInformation("Bridge: 获取用户主页，参数: {Username}", username);
            var userPage = await apiService.GetUserPageInfo(username);
            return JsonSerializer.Serialize(userPage, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取用户主页失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> FollowUserAsync(string url)
    {
         try
        {
            var result = await apiService.FollowUser(url);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> BlockUserAsync(string url)
    {
         try
        {
            var result = await apiService.BlockUser(url);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
