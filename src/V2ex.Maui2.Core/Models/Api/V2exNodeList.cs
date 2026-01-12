namespace V2ex.Maui2.Core.Models.Api;

/// <summary>
/// V2EX JSON API 节点列表响应模型
/// </summary>
public class V2exNodeList
{
    /// <summary>
    /// 所有节点列表
    /// </summary>
    public List<V2exNodeInfo>? Nodes { get; set; }
}
