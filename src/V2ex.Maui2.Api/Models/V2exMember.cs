using System.Text.Json.Serialization;

namespace V2ex.Maui2.Api.Models;

public class V2exMember
{
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("tagline")]
    public string Tagline { get; set; } = string.Empty;
}