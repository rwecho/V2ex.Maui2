using System.Text.Json.Serialization;

namespace V2ex.Maui2.Api.Models;

public class V2exNodeInfo
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("header")]
    public string Header { get; set; } = string.Empty;

    [JsonPropertyName("title_alternative")]
    public string TitleAlternative { get; set; } = string.Empty;

    [JsonPropertyName("node_name")]
    public string NodeName { get; set; } = string.Empty;
}