namespace V2ex.Maui2.App.Models.V2ex;

/// <summary>
/// V2EX 节点模型
/// </summary>
public class Node
{
    /// <summary>
    /// 节点名称（URL中的标识）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 节点标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 节点图标URL
    /// </summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>
    /// 节点描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 话题数量
    /// </summary>
    public int TopicCount { get; set; }

    /// <summary>
    /// 节点分类
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 头部图片URL
    /// </summary>
    public string Header { get; set; } = string.Empty;
}
