namespace V2ex.Maui2.App.Models.Api;

/// <summary>
/// V2EX JSON API 节点信息模型
/// </summary>
public class V2exNodeInfo
{
    /// <summary>
    /// 节点ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 节点名称（URL中的标识）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 节点标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 节点标题（URL别名）
    /// </summary>
    public string TitleAlternative { get; set; } = string.Empty;

    /// <summary>
    /// 节点图标URL
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 节点头部图片URL
    /// </summary>
    public string? Header { get; set; }

    /// <summary>
    /// 节点分类
    /// </summary>
    public string? ParentNodeName { get; set; }

    /// <summary>
    /// 节点描述
    /// </summary>
    public string? Footer { get; set; }

    /// <summary>
    /// 话题数量
    /// </summary>
    public int Topics { get; set; }

    /// <summary>
    /// 节点创建时间（Unix时间戳）
    /// </summary>
    public long Created { get; set; }

    /// <summary>
    /// 最后修改时间（Unix时间戳）
    /// </summary>
    public long LastModified { get; set; }
}
