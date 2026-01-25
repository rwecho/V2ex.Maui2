using System.Text.Json.Serialization;

namespace V2ex.Maui2.Api.Models;

public class V2exTopicDetail
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("content_rendered")]
    public string ContentRendered { get; set; } = string.Empty;
}