using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.V2ex;
using CommunityToolkit.Maui.Alerts;

namespace V2ex.Maui2.App.Services.Bridge;

/// <summary>
/// Maui Bridge 服务 - 用于与 JavaScript 通信
/// </summary>
public class MauiBridge
{
    private readonly V2exJsonService _v2exService;
    private readonly ILogger<MauiBridge> _logger;

    public MauiBridge(V2exJsonService v2exService, ILogger<MauiBridge> logger)
    {
        _v2exService = v2exService;
        _logger = logger;
    }

    /// <summary>
    /// 获取最新话题列表
    /// </summary>
    /// <returns>JSON 格式的话题列表</returns>
    public async Task<string> GetLatestTopicsAsync()
    {
        try
        {
            _logger.LogInformation("Bridge: 获取最新话题");
            var topics = await _v2exService.GetLatestTopicsAsync();

            return JsonSerializer.Serialize(topics, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取最新话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取热门话题列表
    /// </summary>
    /// <returns>JSON 格式的话题列表</returns>
    public async Task<string> GetHotTopicsAsync()
    {
        try
        {
            _logger.LogInformation("Bridge: 获取热门话题");

            var topics = await _v2exService.GetHotTopicsAsync();

            return JsonSerializer.Serialize(topics, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取热门话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取 Tab 话题列表（通过 HTML 解析）
    /// </summary>
    /// <param name="tab">Tab 名称，例如: tech, creative, play</param>
    /// <returns>JSON 格式的话题列表</returns>
    public async Task<string> GetTabTopicsAsync(string tab)
    {
        try
        {
            _logger.LogInformation("Bridge: 获取 Tab 话题，Tab={Tab}", tab);

            var topics = await _v2exService.GetTabTopicsAsync(tab);

            return JsonSerializer.Serialize(topics, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取 Tab 话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取节点话题列表
    /// </summary>
    /// <param name="jsonArgs">JSON 参数，例如: {"nodeName": "python", "page": 1}</param>
    /// <returns>JSON 格式的话题列表</returns>
    public async Task<string> GetNodeTopicsAsync(string nodeName, int page = 1)
    {
        try
        {
            _logger.LogInformation("Bridge: 获取节点话题，参数: nodeName={NodeName}, page={Page}", nodeName, page);

            var topics = await _v2exService.GetNodeTopicsAsync(nodeName, page);

            return JsonSerializer.Serialize(topics, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取节点话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取话题详情（包含回复）
    /// </summary>
    /// <param name="jsonArgs">JSON 参数，例如: {"topicId": 12345}</param>
    /// <returns>JSON 格式的话题详情</returns>
    public async Task<string> GetTopicDetailAsync(string jsonArgs)
    {
        try
        {
            _logger.LogInformation("Bridge: 获取话题详情，参数: {Args}", jsonArgs);

            var args = JsonSerializer.Deserialize<GetTopicArgs>(jsonArgs);
            var topicId = args?.TopicId ?? 0;
            if (topicId <= 0)
            {
                return JsonSerializer.Serialize(new { error = "Invalid topicId" });
            }

            // 并行获取 topic 基本信息 + replies
            var topicTask = _v2exService.GetTopicDetailAsync(topicId);
            var repliesTask = _v2exService.GetRepliesAsync(topicId);
            await Task.WhenAll(topicTask, repliesTask);

            var topicDetail = new V2exTopicDetail
            {
                Topic = await topicTask,
                Replies = await repliesTask,
                Page = 1,
                TotalPages = 1
            };

            return JsonSerializer.Serialize(topicDetail, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取话题详情失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取节点列表
    /// </summary>
    /// <returns>JSON 格式的节点列表</returns>
    public async Task<string> GetNodesAsync()
    {
        try
        {
            _logger.LogInformation("Bridge: 获取节点列表");

            var nodes = await _v2exService.GetAllNodesAsync();

            return JsonSerializer.Serialize(nodes, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取节点列表失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取节点详情
    /// </summary>
    /// <param name="jsonArgs">JSON 参数，例如: {"nodeName": "python"}</param>
    /// <returns>JSON 格式的节点详情</returns>
    public async Task<string> GetNodeDetailAsync(string jsonArgs)
    {
        try
        {
            _logger.LogInformation("Bridge: 获取节点详情，参数: {Args}", jsonArgs);

            var args = JsonSerializer.Deserialize<GetNodeArgs>(jsonArgs);
            var node = await _v2exService.GetNodeInfoAsync(args?.NodeName ?? "");

            return JsonSerializer.Serialize(node, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取节点详情失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取用户信息
    /// </summary>
    /// <param name="jsonArgs">JSON 参数，例如: {"username": "username"}</param>
    /// <returns>JSON 格式的用户信息</returns>
    public async Task<string> GetUserProfileAsync(string jsonArgs)
    {
        try
        {
            _logger.LogInformation("Bridge: 获取用户信息，参数: {Args}", jsonArgs);

            var args = JsonSerializer.Deserialize<GetUserArgs>(jsonArgs);
            var user = await _v2exService.GetMemberInfoAsync(args?.Username ?? "");

            return JsonSerializer.Serialize(user, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取用户信息失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 获取平台信息（用于 React 环境检测）
    /// </summary>
    /// <returns>平台名称（iOS/Android/Mac/Windows/Unknown）</returns>
    public string GetPlatformInfo()
    {
        try
        {
            string platform = DeviceInfo.Platform.ToString() switch
            {
                "iOS" => "iOS",
                "Android" => "Android",
                "MacCatalyst" => "Mac",
                "WinUI" => "Windows",
                "Tizen" => "Tizen",
                "macOS" => "Mac",
                _ => "Unknown"
            };

            _logger.LogInformation("Bridge: 获取平台信息 - {Platform}", platform);
            return platform;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bridge: 获取平台信息失败");
            return "Unknown";
        }
    }


    public Task<string?> GetStringValue(string key)
    {
        return Task.FromResult((string?)Preferences.Default.Get(key, string.Empty));
    }

    public Task SetStringValue(string key, string value)
    {
        Preferences.Default.Set(key, value);
        return Task.CompletedTask;
    }


    // show snackbar
    public void ShowSnackbar(string message)
    {
        Snackbar.Make(message).Show();
    }


    // show toast
    public void ShowToast(string message)
    {
        Toast.Make(message, CommunityToolkit.Maui.Core.ToastDuration.Short).Show();
    }

    public Task<SystemInfo> GetSystemInfo()
    {
        var systemInfo = new SystemInfo
        {
            Platform = DeviceInfo.Platform.ToString(),
            AppVersion = AppInfo.VersionString,
            DeviceModel = DeviceInfo.Model,
            Manufacturer = DeviceInfo.Manufacturer,
            DeviceName = DeviceInfo.Name,
            OperatingSystem = DeviceInfo.VersionString
        };
        return Task.FromResult(systemInfo);
    }

    #region 参数类

    private class GetNodeTopicsArgs
    {
        public string NodeName { get; set; } = string.Empty;
        public int? Page { get; set; }
    }

    private class GetTopicArgs
    {
        public int TopicId { get; set; }
    }

    private class GetUserArgs
    {
        public string Username { get; set; } = string.Empty;
    }

    private class GetNodeArgs
    {
        public string NodeName { get; set; } = string.Empty;
    }

    #endregion
}

