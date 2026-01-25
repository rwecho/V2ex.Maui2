using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public async Task<string> GetNodesAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取节点列表");
            var nodes = await apiService.GetNodesInfo(); 
            return JsonSerializer.Serialize(nodes, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取节点列表失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetNodesNavInfoAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取节点导航信息");
            var navInfo = await apiService.GetNodesNavInfo();
            return JsonSerializer.Serialize(navInfo, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取节点导航信息失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetNodeDetailAsync(string nodeName)
    {
        try
        {
            logger.LogInformation("Bridge: 获取节点详情，Node: {Node}", nodeName);
            var node = await apiService.GetNodeInfo(nodeName);
            return JsonSerializer.Serialize(node, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取节点详情失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetNodeTopicsAsync(string nodeName, int page = 1)
    {
        try
        {
            logger.LogInformation("Bridge: 获取节点话题，Node: {Node}, Page: {Page}", nodeName, page);
            var topics = await apiService.GetNodePageInfo(nodeName, page);
            return JsonSerializer.Serialize(topics, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取节点话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
    
    public async Task<string> IgnoreNodeAsync(string nodeId, string once)
    {
        try
        {
             var result = await apiService.IgnoreNode(nodeId, once);
             return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> UnignoreNodeAsync(string nodeId, string once)
    {
        try
        {
             var result = await apiService.UnignoreNode(nodeId, once);
             return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
