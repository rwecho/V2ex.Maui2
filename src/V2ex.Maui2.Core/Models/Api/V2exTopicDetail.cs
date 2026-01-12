namespace V2ex.Maui2.Core.Models.Api;

/// <summary>
/// V2EX JSON API 话题详情响应模型
/// </summary>
public class V2exTopicDetail
{
    /// <summary>
    /// 话题基本信息
    /// </summary>
    public V2exTopic? Topic { get; set; }

    /// <summary>
    /// 回复列表（如果是按时间倒序，第一条可能是楼主）
    /// </summary>
    public List<V2exReply>? Replies { get; set; }

    /// <summary>
    /// 当前页码（用于分页）
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 总页数
    /// </summary>
    public int TotalPages { get; set; }
}
