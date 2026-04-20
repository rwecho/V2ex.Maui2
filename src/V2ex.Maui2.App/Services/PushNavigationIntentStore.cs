using System.Text.RegularExpressions;

namespace V2ex.Maui2.App.Services;

public static partial class PushNavigationIntentStore
{
    private const string TopicIdKey = "push_pending_topic_id";
    private const string LinkKey = "push_pending_link";

    [GeneratedRegex(@"/t/(\d+)")]
    private static partial Regex TopicLinkRegex();

    public static bool TryStore(string? topicId, string? link)
    {
        var resolvedLink = link?.Trim() ?? string.Empty;
        var resolvedTopicId = ExtractTopicId(topicId, resolvedLink);
        if (string.IsNullOrWhiteSpace(resolvedTopicId))
        {
            return false;
        }

        Preferences.Default.Set(TopicIdKey, resolvedTopicId);
        Preferences.Default.Set(LinkKey, resolvedLink);
        return true;
    }

    public static (bool HasPending, string TopicId, string Link) Peek()
    {
        var topicId = Preferences.Default.Get(TopicIdKey, string.Empty);
        var link = Preferences.Default.Get(LinkKey, string.Empty);
        return (!string.IsNullOrWhiteSpace(topicId), topicId, link);
    }

    public static void Clear()
    {
        Preferences.Default.Remove(TopicIdKey);
        Preferences.Default.Remove(LinkKey);
    }

    public static string ExtractTopicId(string? topicId, string? link)
    {
        var resolvedTopicId = topicId?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(resolvedTopicId))
        {
            return resolvedTopicId;
        }

        var resolvedLink = link?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(resolvedLink))
        {
            return string.Empty;
        }

        var match = TopicLinkRegex().Match(resolvedLink);
        return match.Success ? match.Groups[1].Value : string.Empty;
    }
}
