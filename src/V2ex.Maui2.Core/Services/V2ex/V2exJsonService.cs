using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.Interfaces;

namespace V2ex.Maui2.Core.Services.V2ex;

/// <summary>
/// V2EX JSON API 服务 - 使用官方 JSON API 端点
/// </summary>
public class V2exJsonService
{
    private readonly IV2exJsonApi _api;
    private readonly ILogger<V2exJsonService> _logger;
    private readonly V2exHtmlParser _htmlParser;

    public V2exJsonService(IV2exJsonApi api, ILogger<V2exJsonService> logger, V2exHtmlParser htmlParser)
    {
        _api = api;
        _logger = logger;
        _htmlParser = htmlParser;
    }

    /// <summary>
    /// 获取热门话题
    /// </summary>
    public async Task<List<V2exTopic>> GetHotTopicsAsync()
    {
        try
        {

            _logger.LogInformation("Fetching hot topics from V2EX API");

            var topics = await _api.GetHotTopicsAsync();

            _logger.LogInformation("Successfully fetched {Count} hot topics", topics.Count);
            return topics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching hot topics");
            throw;
        }
    }

    /// <summary>
    /// 获取最新话题
    /// </summary>
    public async Task<List<V2exTopic>> GetLatestTopicsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching latest topics from V2EX API");

            var topics = await _api.GetLatestTopicsAsync();

            _logger.LogInformation("Successfully fetched {Count} latest topics", topics.Count);
            return topics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching latest topics");
            throw;
        }
    }

    /// <summary>
    /// 获取话题详情（仅包含话题基本信息）
    /// 注意：V2EX API 不通过此端点返回回复列表
    /// </summary>
    public async Task<V2exTopic?> GetTopicDetailAsync(int topicId)
    {
        try
        {
            _logger.LogInformation("Fetching topic detail for topic {TopicId}", topicId);

            var topics = await _api.GetTopicDetailAsync(topicId);
            var topic = topics?.FirstOrDefault();

            if (topic == null)
            {
                _logger.LogWarning("No topic detail found for topic {TopicId}", topicId);
                return null;
            }

            _logger.LogInformation("Successfully fetched topic {TopicId}", topicId);

            return topic;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching topic detail for topic {TopicId}", topicId);
            throw
        }
    }

    /// <summary>
    /// 获取节点话题列表（通过 HTML 解析）
    /// </summary>
    public async Task<List<V2exTopic>> GetNodeTopicsAsync(string nodeName, int? page = null)
    {
        return await _htmlParser.GetNodeTopicsAsync(nodeName, page ?? 1);
    }

    /// <summary>
    /// 获取 Tab 话题列表（通过 HTML 解析）
    /// 例如: tech, creative, play, apple, jobs...
    /// </summary>
    public async Task<List<V2exTopic>> GetTabTopicsAsync(string tab)
    {
        return await _htmlParser.GetTabTopicsAsync(tab);
    }

    /// <summary>
    /// 获取节点详情
    /// </summary>
    public async Task<V2exNodeInfo?> GetNodeInfoAsync(string nodeName)
    {
        try
        {
            _logger.LogInformation("Fetching node info for {NodeName}", nodeName);

            var nodeInfo = await _api.GetNodeInfoAsync(nodeName);

            if (nodeInfo == null)
            {
                _logger.LogWarning("No node info found for {NodeName}", nodeName);
                return null;
            }

            _logger.LogInformation("Successfully fetched node info for {NodeName}", nodeName);

            return nodeInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching node info for {NodeName}", nodeName);
            throw
        }
    }

    /// <summary>
    /// 获取所有节点列表
    /// </summary>
    public async Task<List<V2exNodeInfo>> GetAllNodesAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all nodes from V2EX API");

            var nodes = await _api.GetAllNodesAsync();

            _logger.LogInformation("Successfully fetched {Count} nodes", nodes?.Count ?? 0);

            return nodes ?? new List<V2exNodeInfo>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all nodes");

            throw;
        }
    }

    /// <summary>
    /// 获取用户信息
    /// </summary>
    public async Task<V2exMember?> GetMemberInfoAsync(string username)
    {
        try
        {
            _logger.LogInformation("Fetching member info for {Username}", username);

            var member = await _api.GetMemberInfoAsync(username);

            if (member == null)
            {
                _logger.LogWarning("No member info found for {Username}", username);
                return null;
            }

            _logger.LogInformation("Successfully fetched member info for {Username}", username);

            return member;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching member info for {Username}", username);
            throw;
        }
    }

    /// <summary>
    /// 获取话题回复列表
    /// </summary>
    public async Task<List<V2exReply>> GetRepliesAsync(int topicId)
    {
        try
        {
            _logger.LogInformation("Fetching replies for topic {TopicId}", topicId);

            var replies = await _api.GetRepliesAsync(topicId);

            _logger.LogInformation("Successfully fetched {Count} replies for topic {TopicId}", replies.Count, topicId);
            return replies;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching replies for topic {TopicId}", topicId);
            throw
        }
    }
}
