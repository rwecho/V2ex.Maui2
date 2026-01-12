namespace V2ex.Maui2.App.Models.V2ex;

/// <summary>
/// V2EX 用户模型
/// </summary>
public class User
{
    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 头像URL
    /// </summary>
    public string Avatar { get; set; } = string.Empty;

    /// <summary>
    /// 个人简介
    /// </summary>
    public string Bio { get; set; } = string.Empty;

    /// <summary>
    /// 所在位置
    /// </summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// 个人网站
    /// </summary>
    public string Website { get; set; } = string.Empty;

    /// <summary>
    /// GitHub 用户名
    /// </summary>
    public string GitHub { get; set; } = string.Empty;

    /// <summary>
    /// 注册时间
    /// </summary>
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// 话题数量
    /// </summary>
    public int TopicCount { get; set; }

    /// <summary>
    /// 评论数量
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// 关注者数量
    /// </summary>
    public int FollowerCount { get; set; }

    /// <summary>
    /// 正在关注数量
    /// </summary>
    public int FollowingCount { get; set; }

    /// <summary>
    /// 收藏的话题数量
    /// </summary>
    public int FavoriteCount { get; set; }
}
