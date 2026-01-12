namespace V2ex.Maui2.Core.Models.Api;

/// <summary>
/// V2EX JSON API 评论/回复模型
/// </summary>
public class V2exReply
{
    /// <summary>
    /// 回复ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 回复内容（纯文本）
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 回复内容（渲染后的HTML）
    /// </summary>
    public string ContentRendered { get; set; } = string.Empty;

    /// <summary>
    /// 回复时间（Unix时间戳）
    /// </summary>
    public long Created { get; set; }

    /// <summary>
    /// 回复作者信息
    /// </summary>
    public V2exMember? Member { get; set; }

    /// <summary>
    /// 是否是楼主
    /// </summary>
    public bool IsOp { get; set; }

    /// <summary>
    /// 回复正文中@的用户
    /// </summary>
    public List<string>? Mentioned { get; set; }
}
