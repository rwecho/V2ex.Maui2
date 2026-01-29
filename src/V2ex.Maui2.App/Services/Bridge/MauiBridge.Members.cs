using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public Task<string> GetUserProfileAsync(string username)
    {
        return ExecuteSafeAsync(() => apiService.GetMemberInfo(username));
    }
    
    public Task<string> GetUserPageAsync(string username)
    {
         return ExecuteSafeAsync(() => apiService.GetUserPageInfo(username));
    }

    public Task<string> FollowUserAsync(string url)
    {
         return ExecuteSafeAsync(() => apiService.FollowUser(url));
    }

    public Task<string> BlockUserAsync(string url)
    {
         return ExecuteSafeAsync(() => apiService.BlockUser(url));
    }
}
