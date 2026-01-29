using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public Task<string> GetNodesAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetNodesInfo());
    }

    public Task<string> GetNodesNavInfoAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetNodesNavInfo());
    }

    public Task<string> GetNodeDetailAsync(string nodeName)
    {
        return ExecuteSafeAsync(() => apiService.GetNodeInfo(nodeName));
    }

    public Task<string> GetNodeTopicsAsync(string nodeName, int page = 1)
    {
        return ExecuteSafeAsync(() => apiService.GetNodePageInfo(nodeName, page));
    }
    
    public Task<string> IgnoreNodeAsync(string nodeId, string once)
    {
        return ExecuteSafeAsync(() => apiService.IgnoreNode(nodeId, once));
    }

    public Task<string> UnignoreNodeAsync(string nodeId, string once)
    {
        return ExecuteSafeAsync(() => apiService.UnignoreNode(nodeId, once));
    }
}
