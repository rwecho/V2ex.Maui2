namespace V2ex.Maui2.App.Models.V2ex;

/// <summary>
/// V2EX 评论模型
/// </summary>
public class Comment
{
    /// <summary>
    /// 评论ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 话题ID
    /// </summary>
    public string TopicId { get; set; } = string.Empty;

    /// <summary>
    /// 评论内容（HTML格式）
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 评论者用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 评论者头像URL
    /// </summary>
    public string Avatar { get; set; } = string.Empty;

    /// <summary>
    /// 楼层号
    /// </summary>
    public int Floor { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 是否为作者回复
    /// </summary>
    public bool IsAuthor { get; set; }

    /// <summary>
    /// 回复的评论ID（如果是对其他评论的回复）
    /// </summary>
    public string? ReplyToCommentId { get; set; }

    /// <summary>
    /// 感谢数量
    /// </summary>
    public int ThankCount { get; set; }
}
