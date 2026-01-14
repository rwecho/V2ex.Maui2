using Refit;
using V2ex.Maui2.Core.Models.Api;

namespace V2ex.Maui2.Core.Services.Interfaces;

/// <summary>
/// V2EX JSON API 接口（使用 Refit）
/// </summary>
public interface IV2exJsonApi
{
    /// <summary>
    /// 获取热门话题
    /// </summary>
    [Get("/api/topics/hot.json")]
    Task<List<V2exTopic>> GetHotTopicsAsync();

    /// <summary>
    /// 获取最新话题
    /// </summary>
    [Get("/api/topics/latest.json")]
    Task<List<V2exTopic>> GetLatestTopicsAsync();

    /// <summary>
    /// 获取话题详情（包含回复）
    /// 注意：V2EX API 只返回话题基本信息，不包含回复列表
    /// </summary>
    /// <param name="topicId">话题ID</param>
    [Get("/api/topics/show.json")]
    Task<List<V2exTopic>> GetTopicDetailAsync([AliasAs("id")][Query] int topicId);

    /// <summary>
    /// 获取话题回复列表
    /// </summary>
    /// <param name="topicId">话题ID</param>
    [Get("/api/replies/show.json")]
    Task<List<V2exReply>> GetRepliesAsync([AliasAs("topic_id")][Query] int topicId);

    /// <summary>
    /// 获取节点话题列表
    /// </summary>
    /// <param name="nodeName">节点名称</param>
    /// <param name="page">页码（可选）</param>
    [Get("/api/nodes/{nodeName}/topics.json")]
    Task<List<V2exTopic>> GetNodeTopicsAsync(string nodeName, [Query] int? page = null);

    /// <summary>
    /// 获取节点详情
    /// </summary>
    /// <param name="nodeName">节点名称</param>
    [Get("/api/nodes/show.json")]
    Task<V2exNodeInfo> GetNodeInfoAsync([AliasAs("name")][Query] string nodeName);

    /// <summary>
    /// 获取所有节点列表
    /// </summary>
    [Get("/api/nodes/all.json")]
    Task<List<V2exNodeInfo>> GetAllNodesAsync();

    /// <summary>
    /// 获取用户信息
    /// </summary>
    /// <param name="username">用户名</param>
    [Get("/api/members/show.json")]
    Task<V2exMember> GetMemberInfoAsync([Query] string username);
}
