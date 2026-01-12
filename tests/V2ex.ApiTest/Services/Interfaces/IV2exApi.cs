using Refit;

namespace V2ex.Maui2.App.Services.Interfaces;

/// <summary>
/// V2EX HTTP API 接口（使用 Refit）
/// </summary>
public interface IV2exApi
{
    /// <summary>
    /// 获取首页 HTML
    /// </summary>
    [Get("/")]
    Task<string> GetIndexAsync();

    /// <summary>
    /// 获取节点话题列表 HTML
    /// </summary>
    /// <param name="nodeName">节点名称</param>
    [Get("/go/{nodeName}")]
    Task<string> GetNodePageAsync(string nodeName);

    /// <summary>
    /// 获取话题详情 HTML
    /// </summary>
    /// <param name="topicId">话题ID</param>
    [Get("/t/{topicId}")]
    Task<string> GetTopicAsync(string topicId);

    /// <summary>
    /// 获取用户信息 HTML
    /// </summary>
    /// <param name="username">用户名</param>
    [Get("/member/{username}")]
    Task<string> GetUserAsync(string username);

    /// <summary>
    /// 获取节点列表 HTML
    /// </summary>
    [Get("/planes")]
    Task<string> GetNodesAsync();
}
