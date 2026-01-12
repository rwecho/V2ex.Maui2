namespace V2ex.Maui2.Core.Models.Api;

/// <summary>
/// V2EX JSON API 用户/成员模型
/// </summary>
public class V2exMember
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称（通常与username相同）
    /// </summary>
    public string Tagline { get; set; } = string.Empty;

    /// <summary>
    /// 头像URL（普通分辨率）
    /// </summary>
    public string AvatarLarge { get; set; } = string.Empty;

    /// <summary>
    /// 头像URL（小图）
    /// </summary>
    public string AvatarMini { get; set; } = string.Empty;

    /// <summary>
    /// 用户状态（正常/被封禁等）
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 所在位置
    /// </summary>
    public string? Bio { get; set; }

    /// <summary>
    /// 个人网站URL
    /// </summary>
    public string? Website { get; set; }

    /// <summary>
    /// GitHub用户名
    /// </summary>
    public string? Github { get; set; }

    /// <summary>
    /// 注册时间（Unix时间戳）
    /// </summary>
    public long Created { get; set; }

    /// <summary>
    /// 话题数量
    /// </summary>
    public int NumTopics { get; set; }

    /// <summary>
    /// 评论数量
    /// </summary>
    public int NumPosts { get; set; }

    /// <summary>
    /// 关注者数量
    /// </summary>
    public int Followers { get; set; }
}
