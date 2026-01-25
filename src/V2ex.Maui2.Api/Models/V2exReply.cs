using System.Text.Json.Serialization;

namespace V2ex.Maui2.Api.Models;

public class V2exReply
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("created")]
    public string Created { get; set; } = string.Empty;
}