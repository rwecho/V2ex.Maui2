namespace V2ex.Maui2.Core.Models.Api;

/// <summary>
/// V2EX JSON API 话题响应模型
/// </summary>
public class V2exTopic
{
    /// <summary>
    /// 话题ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 话题标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 话题内容（纯文本）
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 话题内容（渲染后的HTML）
    /// </summary>
    public string ContentRendered { get; set; } = string.Empty;

    /// <summary>
    /// 话题URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间（Unix时间戳）
    /// </summary>
    public long Created { get; set; }

    /// <summary>
    /// 最后修改时间（Unix时间戳）
    /// </summary>
    public long LastModified { get; set; }

    /// <summary>
    /// 最后回复时间（Unix时间戳）
    /// </summary>
    public long LastTouched { get; set; }

    /// <summary>
    /// 回复数量
    /// </summary>
    public int Replies { get; set; }

    /// <summary>
    /// 作者信息
    /// </summary>
    public V2exMember? Member { get; set; }

    /// <summary>
    /// 所属节点信息
    /// </summary>
    public V2exNodeInfo? Node { get; set; }

    /// <summary>
    /// 话题是否被删除 (0=未删除, 1=已删除)
    /// </summary>
    public int Deleted { get; set; }
}
