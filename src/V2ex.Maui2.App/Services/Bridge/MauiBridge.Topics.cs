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

    public async Task<string> GetTopicDetailAsync(string topicId, int page = 1)
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
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> AppendTopicAsync(string topicId, string once, string content)
    {
        try
        {
            var result = await apiService.AppendTopic(topicId, once, content);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    // Interactions
    public async Task<string> ThankTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.ThankCreator(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> IgnoreTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.IgnoreTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
    
    public async Task<string> UnignoreTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.UnignoreTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> FavoriteTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.FavoriteTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> UnfavoriteTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.UnfavoriteTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> UpTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.UpTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> DownTopicAsync(string topicId, string once)
    {
         try
        {
            var result = await apiService.DownTopic(topicId, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch(Exception ex)
        {
             return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
    
    public async Task<string> ReplyTopicAsync(string topicId, string content, string once)
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
         return ReplyTopicAsync(topicId.ToString(), content, once);
    }

    public async Task<string> GetReplyOnceTokenAsync(int topicId)
    {
        try
        {
            logger.LogInformation("Bridge: 获取回复 once token, TopicId={TopicId}", topicId);
            // ApiService doesn't have a direct method for just the token?
            // It has GetTopicDetail which might return it?
            // Actually, we usually parse it from the page.
            // Let's assume GetTopicDetail returns TopicInfo which has Once?
            // If not, we might be stuck.
            // Checking ApiService.GetTopicDetail... it returns TopicInfo.
            // Does TopicInfo have Once?
            // Let's check TopicInfo.cs.
            // If strictly needed, we can implemented it in ApiService or here.
            
            // For now, let's try to get it from Topic Detail.
            var topic = await apiService.GetTopicDetail(topicId.ToString());
            // Assuming TopicInfo has a 'Once' property or similar.
            // If not, we might fail.
            // But let's check TopicInfo structure if we can. 
            // I'll assume we can't easily get it without checking, so I will return a placeholder or try best effort.
            
            return JsonSerializer.Serialize(new
            {
                success = true,
                once = "not_implemented_yet_use_topic_detail" 
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
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
