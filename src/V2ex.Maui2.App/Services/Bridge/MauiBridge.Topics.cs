using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public Task<string> GetLatestTopicsAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetDailyHot());
    }

    public Task<string> GetHotTopicsAsync()
    {
        // Using daily hot for hot topics as per original code
        return ExecuteSafeAsync(() => apiService.GetDailyHot());
    }

    public Task<string> GetRecentTopicsAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetRecentTopics());
    }

    public Task<string> GetTagInfoAsync(string tagName)
    {
        return ExecuteSafeAsync(() => apiService.GetTagInfo(tagName));
    }

    public Task<string> GetTopicDetailAsync(int topicId, int page = 1)
    {
        return ExecuteSafeAsync(() => apiService.GetTopicDetail(topicId, page));
    }

    public Task<string> CreateTopicAsync(string title, string content, string nodeId, string once)
    {
        return ExecuteSafeAsync(() => apiService.PostTopic(title, content, nodeId, once));
    }

    public Task<string> GetAppendTopicParameterAsync(string topicId)
    {
        return ExecuteSafeAsync(() => apiService.GetAppendTopicParameter(topicId));
    }

    public Task<string> AppendTopicAsync(int topicId, string once, string content)
    {
        return ExecuteSafeAsync(() => apiService.AppendTopic(topicId, once, content));
    }

    // Interactions
    public Task<string> ThankTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.ThankCreator(topicId, once));
    }

    public Task<string> IgnoreTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.IgnoreTopic(topicId, once));
    }

    public Task<string> UnignoreTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.UnignoreTopic(topicId, once));
    }

    public Task<string> FavoriteTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.FavoriteTopic(topicId, once));
    }

    public Task<string> UnfavoriteTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.UnfavoriteTopic(topicId, once));
    }

    public Task<string> UpTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.UpTopic(topicId, once));
    }

    public Task<string> DownTopicAsync(int topicId, string once)
    {
        return ExecuteSafeAsync(() => apiService.DownTopic(topicId, once));
    }

    public Task<string> ReplyTopicAsync(int topicId, string content, string once)
    {
        return ExecuteSafeAsync(() => apiService.ReplyTopic(topicId, content, once));
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
        return await ExecuteSafeAsync(async () =>
        {
            logger.LogInformation("Bridge: 获取回复 once token, TopicId={TopicId}", topicId);

            // 从话题详情中提取 once token
            var topicInfo = await apiService.GetTopicDetail(topicId);

            // TopicInfo 是一个对象，包含 Once 属性
            if (topicInfo != null && !string.IsNullOrEmpty(topicInfo.Once))
            {
                logger.LogInformation("Bridge: 成功获取 once token, length={Length}", topicInfo.Once.Length);

                return new
                {
                    success = true,
                    once = topicInfo.Once
                };
            }

            logger.LogWarning("Bridge: TopicInfo.Once 为空或 null");
            throw new Exception("无法获取 once token：TopicInfo.Once 为空或 null");
        });
    }


    public Task<string> ReportTopicAsync(int topicId, string title)
    {
        return ExecuteSafeVoidAsync(async () =>
        {
            var subject = $"[Report] Topic #{topicId}: {title}";
            var body = $"I would like to report the following topic due to inappropriate content:\n\nTopic ID: {topicId}\nTitle: {title}\n\n(Please describe the issue below)\n";
            var recipients = new[] { "rwecho@live.com" };

            var message = new EmailMessage
            {
                Subject = subject,
                Body = body,
                To = recipients.ToList()
            };

            await Email.Default.ComposeAsync(message);
        });
    }

    public Task<string> ThankReplyAsync(string replyId, string once)
    {
        return ExecuteSafeAsync(() => apiService.ThanksReplier(replyId, once));
    }

    public Task<string> IgnoreReplyAsync(string replyId, string once)
    {
        replyId = replyId.Replace("r_", "");
        return ExecuteSafeAsync(() => apiService.IgnoreReply(replyId, once));
    }
}
