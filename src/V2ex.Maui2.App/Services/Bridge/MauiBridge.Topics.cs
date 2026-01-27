using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public async Task<string> GetLatestTopicsAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取最新话题");
            var topics = await apiService.GetDailyHot();
            return JsonSerializer.Serialize(topics, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取最新话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetHotTopicsAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取热门话题");
            var topics = await apiService.GetDailyHot(); // Using daily hot for hot topics
            return JsonSerializer.Serialize(topics, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取热门话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetRecentTopicsAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取最近话题");
            var topics = await apiService.GetRecentTopics();
            return JsonSerializer.Serialize(topics, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取最近话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetTagInfoAsync(string tagName)
    {
        try
        {
            logger.LogInformation("Bridge: get tag topics, Tag: {Tag}", tagName);
            var tagInfo = await apiService.GetTagInfo(tagName);
            return JsonSerializer.Serialize(tagInfo, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: get tag topics failed");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetTopicDetailAsync(int topicId, int page = 1)
    {
        try
        {
            logger.LogInformation("Bridge: 获取话题详情，ID: {Id}, Page: {Page}", topicId, page);
            var topic = await apiService.GetTopicDetail(topicId, page);
            return JsonSerializer.Serialize(topic, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取话题详情失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> CreateTopicAsync(string title, string content, string nodeId, string once)
    {
        try
        {
            logger.LogInformation("Bridge: 创建话题");
            var result = await apiService.PostTopic(title, content, nodeId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 创建话题失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetAppendTopicParameterAsync(string topicId)
    {
        try
        {
            var result = await apiService.GetAppendTopicParameter(topicId);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> AppendTopicAsync(int topicId, string once, string content)
    {
        try
        {
            var result = await apiService.AppendTopic(topicId, once, content);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    // Interactions
    public async Task<string> ThankTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.ThankCreator(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> IgnoreTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.IgnoreTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> UnignoreTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.UnignoreTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> FavoriteTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.FavoriteTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> UnfavoriteTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.UnfavoriteTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> UpTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.UpTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> DownTopicAsync(int topicId, string once)
    {
        try
        {
            var result = await apiService.DownTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> ReplyTopicAsync(int topicId, string content, string once)
    {
        try
        {
            var result = await apiService.ReplyTopic(topicId, content, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    // Legacy mapping
    public Task<string> PostReplyAsync(int topicId, string content, string once)
    {
        // 解码 URL 编码的内容（用于处理 emoji 等 Unicode 字符）
        var decodedContent = Uri.UnescapeDataString(content);
        return ReplyTopicAsync(topicId, decodedContent, once);
    }

    public async Task<string> GetReplyOnceTokenAsync(int topicId)
    {
        try
        {
            logger.LogInformation("Bridge: 获取回复 once token, TopicId={TopicId}", topicId);

            // 从话题详情中提取 once token
            var topicInfo = await apiService.GetTopicDetail(topicId);

            // TopicInfo 是一个对象，包含 Once 属性
            if (topicInfo != null && !string.IsNullOrEmpty(topicInfo.Once))
            {
                logger.LogInformation("Bridge: 成功获取 once token, length={Length}", topicInfo.Once.Length);

                return JsonSerializer.Serialize(new
                {
                    success = true,
                    once = topicInfo.Once
                }, _jsonOptions);
            }

            logger.LogWarning("Bridge: TopicInfo.Once 为空或 null");
            return JsonSerializer.Serialize(new
            {
                success = false,
                error = "无法获取 once token：TopicInfo.Once 为空或 null"
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取回复 once token 失败");
            return JsonSerializer.Serialize(new { success = false, error = ex.Message }, _jsonOptions);
        }
    }

    public Task<string> RequiresLoginAsync(int topicId)
    {
        // Assuming always require login for reply?
        return Task.FromResult(JsonSerializer.Serialize(new
        {
            success = true,
            requiresLogin = true
        }, _jsonOptions));
    }
}
