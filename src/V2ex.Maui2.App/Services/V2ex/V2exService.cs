using Microsoft.Extensions.Logging;
using V2ex.Maui2.App.Models.V2ex;
using V2ex.Maui2.App.Services.Interfaces;
using V2Node = V2ex.Maui2.App.Models.V2ex.Node;

namespace V2ex.Maui2.App.Services.V2ex;

/// <summary>
/// V2EX 服务实现
/// </summary>
public class V2exService : IV2exService
{
    private readonly IV2exApi _api;
    private readonly IHtmlParser _parser;
    private readonly ILogger<V2exService> _logger;

    public V2exService(IV2exApi api, IHtmlParser parser, ILogger<V2exService> logger)
    {
        _api = api;
        _parser = parser;
        _logger = logger;
    }

    public async Task<List<Topic>> GetTopicsAsync(int page = 1)
    {
        try
        {
            _logger.LogInformation("获取话题列表，页码: {Page}", page);

            // V2EX 首页
            var html = await _api.GetIndexAsync();
            var topics = await _parser.ParseTopicListAsync(html);

            _logger.LogInformation("成功获取 {Count} 个话题", topics.Count);
            return topics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取话题列表失败");
            return new List<Topic>();
        }
    }

    public async Task<List<Topic>> GetNodeTopicsAsync(string nodeName, int page = 1)
    {
        try
        {
            _logger.LogInformation("获取节点话题，节点: {NodeName}, 页码: {Page}", nodeName, page);

            var html = await _api.GetNodePageAsync(nodeName);
            var topics = await _parser.ParseTopicListAsync(html);

            _logger.LogInformation("成功从节点 {NodeName} 获取 {Count} 个话题", nodeName, topics.Count);
            return topics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取节点话题失败，节点: {NodeName}", nodeName);
            return new List<Topic>();
        }
    }

    public async Task<Topic> GetTopicDetailAsync(string topicId)
    {
        try
        {
            _logger.LogInformation("获取话题详情，ID: {TopicId}", topicId);

            var html = await _api.GetTopicAsync(topicId);
            var topic = await _parser.ParseTopicDetailAsync(html);
            topic.Id = topicId;

            _logger.LogInformation("成功获取话题详情: {Title}", topic.Title);
            return topic;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取话题详情失败，ID: {TopicId}", topicId);
            return new Topic();
        }
    }

    public async Task<List<Comment>> GetCommentsAsync(string topicId)
    {
        try
        {
            _logger.LogInformation("获取话题评论，ID: {TopicId}", topicId);

            var html = await _api.GetTopicAsync(topicId);
            var comments = await _parser.ParseCommentListAsync(html);

            // 设置话题 ID
            foreach (var comment in comments)
            {
                comment.TopicId = topicId;
            }

            _logger.LogInformation("成功获取 {Count} 条评论", comments.Count);
            return comments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取话题评论失败，ID: {TopicId}", topicId);
            return new List<Comment>();
        }
    }

    public async Task<User> GetUserProfileAsync(string username)
    {
        try
        {
            _logger.LogInformation("获取用户信息，用户名: {Username}", username);

            var html = await _api.GetUserAsync(username);
            var user = await _parser.ParseUserProfileAsync(html);
            user.Username = username;

            _logger.LogInformation("成功获取用户信息: {Username}", username);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户信息失败，用户名: {Username}", username);
            return new User();
        }
    }

    public async Task<List<V2Node>> GetNodesAsync()
    {
        try
        {
            _logger.LogInformation("获取节点列表");

            var html = await _api.GetNodesAsync();
            var nodes = await _parser.ParseNodeListAsync(html);

            _logger.LogInformation("成功获取 {Count} 个节点", nodes.Count);
            return nodes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取节点列表失败");
            return new List<V2Node>();
        }
    }

    public async Task<V2Node> GetNodeDetailAsync(string nodeName)
    {
        try
        {
            _logger.LogInformation("获取节点详情，节点: {NodeName}", nodeName);

            var html = await _api.GetNodePageAsync(nodeName);
            var node = await _parser.ParseNodeDetailAsync(html);
            node.Name = nodeName;

            _logger.LogInformation("成功获取节点详情: {NodeTitle}", node.Title);
            return node;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取节点详情失败，节点: {NodeName}", nodeName);
            return new V2Node();
        }
    }
}
