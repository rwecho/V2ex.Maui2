using V2ex.Maui2.App.Models.V2ex;
using V2Node = V2ex.Maui2.App.Models.V2ex.Node;

namespace V2ex.Maui2.App.Services.Interfaces;

/// <summary>
/// V2EX 服务接口
/// </summary>
public interface IV2exService
{
    /// <summary>
    /// 获取首页话题列表
    /// </summary>
    /// <param name="page">页码</param>
    /// <returns>话题列表</returns>
    Task<List<Topic>> GetTopicsAsync(int page = 1);

    /// <summary>
    /// 获取节点话题列表
    /// </summary>
    /// <param name="nodeName">节点名称</param>
    /// <param name="page">页码</param>
    /// <returns>话题列表</returns>
    Task<List<Topic>> GetNodeTopicsAsync(string nodeName, int page = 1);

    /// <summary>
    /// 获取话题详情
    /// </summary>
    /// <param name="topicId">话题ID</param>
    /// <returns>话题详情</returns>
    Task<Topic> GetTopicDetailAsync(string topicId);

    /// <summary>
    /// 获取话题评论列表
    /// </summary>
    /// <param name="topicId">话题ID</param>
    /// <returns>评论列表</returns>
    Task<List<Comment>> GetCommentsAsync(string topicId);

    /// <summary>
    /// 获取用户信息
    /// </summary>
    /// <param name="username">用户名</param>
    /// <returns>用户信息</returns>
    Task<User> GetUserProfileAsync(string username);

    /// <summary>
    /// 获取节点列表
    /// </summary>
    /// <returns>节点列表</returns>
    Task<List<V2Node>> GetNodesAsync();

    /// <summary>
    /// 获取节点详情
    /// </summary>
    /// <param name="nodeName">节点名称</param>
    /// <returns>节点详情</returns>
    Task<V2Node> GetNodeDetailAsync(string nodeName);
}
