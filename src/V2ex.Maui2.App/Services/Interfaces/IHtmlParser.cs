using V2ex.Maui2.App.Models.V2ex;
using V2Node = V2ex.Maui2.App.Models.V2ex.Node;

namespace V2ex.Maui2.App.Services.Interfaces;

/// <summary>
/// HTML 解析器接口
/// </summary>
public interface IHtmlParser
{
    /// <summary>
    /// 解析首页话题列表
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>话题列表</returns>
    Task<List<Topic>> ParseTopicListAsync(string html);

    /// <summary>
    /// 解析话题详情
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>话题详情</returns>
    Task<Topic> ParseTopicDetailAsync(string html);

    /// <summary>
    /// 解析评论列表
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>评论列表</returns>
    Task<List<Comment>> ParseCommentListAsync(string html);

    /// <summary>
    /// 解析用户信息
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>用户信息</returns>
    Task<User> ParseUserProfileAsync(string html);

    /// <summary>
    /// 解析节点列表
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>节点列表</returns>
    Task<List<V2Node>> ParseNodeListAsync(string html);

    /// <summary>
    /// 解析节点详情
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>节点详情</returns>
    Task<V2Node> ParseNodeDetailAsync(string html);
}
