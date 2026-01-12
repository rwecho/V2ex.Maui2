namespace V2ex.Maui2.App.Models.V2ex;

/// <summary>
/// V2EX 话题模型
/// </summary>
public class Topic
{
    /// <summary>
    /// 话题ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 话题标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 话题内容（HTML格式）
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 话题URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// 作者用户名
    /// </summary>
    public string Author { get; set; } = string.Empty;

    /// <summary>
    /// 作者头像URL
    /// </summary>
    public string Avatar { get; set; } = string.Empty;

    /// <summary>
    /// 所属节点名称
    /// </summary>
    public string NodeName { get; set; } = string.Empty;

    /// <summary>
    /// 所属节点标题
    /// </summary>
    public string NodeTitle { get; set; } = string.Empty;

    /// <summary>
    /// 最后回复时间
    /// </summary>
    public DateTime LastReplyTime { get; set; }

    /// <summary>
    /// 回复数量
    /// </summary>
    public int ReplyCount { get; set; }

    /// <summary>
    /// 点击次数
    /// </summary>
    public int ClickCount { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
