using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using V2ex.Maui2.Core.Models.Api;

namespace V2ex.Maui2.Core.Services.V2ex;

/// <summary>
/// V2EX HTML 解析器 - 解析 V2EX 网页内容
/// </summary>
public class V2exHtmlParser
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<V2exHtmlParser> _logger;

    public V2exHtmlParser(HttpClient httpClient, ILogger<V2exHtmlParser> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// 获取 Tab 页面的话题列表（无分页）
    /// 例如: /?tab=tech, /?tab=creative
    /// </summary>
    public async Task<List<V2exTopic>> GetTabTopicsAsync(string tab)
    {
        try
        {
            _logger.LogInformation("解析 Tab 页面: {Tab}", tab);

            var url = $"https://www.v2ex.com/?tab={tab}";
            var html = await _httpClient.GetStringAsync(url);

            return ParseTabTopicsFromHtml(html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析 Tab 页面失败: {Tab}", tab);
            throw;
        }
    }

    /// <summary>
    /// 获取节点页面的话题列表（有分页）
    /// 例如: /go/python?p=1
    /// </summary>
    public async Task<List<V2exTopic>> GetNodeTopicsAsync(string nodeName, int page = 1)
    {
        try
        {
            _logger.LogInformation("解析节点页面: {NodeName}, 页码: {Page}", nodeName, page);

            var url = page > 1
                ? $"https://www.v2ex.com/go/{nodeName}?p={page}"
                : $"https://www.v2ex.com/go/{nodeName}";

            var html = await _httpClient.GetStringAsync(url);

            return ParseNodeTopicsFromHtml(html, nodeName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析节点页面失败: {NodeName}, 页码: {Page}", nodeName, page);
            throw;
        }
    }

    private static string NormalizeUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return string.Empty;
        }

        url = url.Trim();
        if (url.StartsWith("//", StringComparison.Ordinal))
        {
            return "https:" + url;
        }

        if (url.StartsWith("/", StringComparison.Ordinal))
        {
            return "https://www.v2ex.com" + url;
        }

        return url;
    }

    private static void TryFillMemberAvatarFromItem(HtmlNode item, V2exMember member)
    {
        // V2EX 页面里头像通常在 <a class="avatar"><img ... /></a>
        // 不同页面结构可能不同，因此使用多 selector + fallback.
        var avatarImg =
            item.SelectSingleNode(".//a[contains(@class, 'avatar')]//img") ??
            item.SelectSingleNode(".//img[contains(@class, 'avatar')]") ??
            item.SelectSingleNode(".//img[contains(@src, 'avatar')]") ??
            item.SelectSingleNode(".//img[contains(@src, '/avatar/')]") ??
            item.SelectSingleNode(".//img[contains(@src, 'cdn.v2ex.com/avatar')]");

        var src = NormalizeUrl(avatarImg?.GetAttributeValue("src", null));
        if (string.IsNullOrWhiteSpace(src))
        {
            return;
        }

        member.AvatarMini = src;

        // 尝试从 mini/normal 推导 large（若本来就是 large，则保持原样）
        var large = src;
        try
        {
            var parts = src.Split('?', 2);
            var path = parts[0];
            var query = parts.Length > 1 ? "?" + parts[1] : string.Empty;

            path = Regex.Replace(
                path,
                @"/(mini|normal)\.(png|jpg|jpeg|gif)$",
                "/large.$2",
                RegexOptions.IgnoreCase);

            large = path + query;
        }
        catch
        {
            // ignore fallback
        }

        member.AvatarLarge = large;
    }

    private static void ParseTopicCommon(HtmlNode item, V2exTopic topic)
    {
        // 标题和话题 ID
        var titleLink = item.SelectSingleNode(".//span[contains(@class, 'item_title')]//a[contains(@class, 'topic-link')]") ??
                        item.SelectSingleNode(".//a[contains(@class, 'topic-link')]");
        if (titleLink != null)
        {
            topic.Title = titleLink.InnerText.Trim();
            var href = titleLink.GetAttributeValue("href", null);
            if (!string.IsNullOrEmpty(href))
            {
                var match = Regex.Match(href, @"/t/(\d+)");
                if (match.Success && int.TryParse(match.Groups[1].Value, out var topicId))
                {
                    topic.Id = topicId;
                }
            }
        }

        // 回复数
        var replyCountLink = item.SelectSingleNode(".//td[@align='right']//a[contains(@class, 'count_livid')]") ??
                            item.SelectSingleNode(".//a[contains(@class, 'count_livid')]");
        if (replyCountLink != null)
        {
            var countText = replyCountLink.InnerText.Trim();
            if (int.TryParse(countText, out var replies))
            {
                topic.Replies = replies;
            }
        }

        // 时间字段（V2EX 使用相对时间，此处暂不解析）
        topic.Created = 0;
        topic.LastModified = 0;
        topic.LastTouched = 0;
    }

    /// <summary>
    /// 从 Tab 页 HTML 中解析话题列表（/?tab=xxx）
    /// </summary>
    private List<V2exTopic> ParseTabTopicsFromHtml(string html)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);
        var topics = new List<V2exTopic>();

        var topicItems = document.DocumentNode.SelectNodes("//div[contains(@class, 'cell') and contains(@class, 'item')]");
        if (topicItems == null) return topics;

        foreach (var item in topicItems)
        {
            try
            {
                var topic = new V2exTopic();
                ParseTopicCommon(item, topic);

                // 节点信息（Tab 列表通常会显示节点）
                var nodeLink = item.SelectSingleNode(".//span[contains(@class, 'topic_info')]//a[contains(@class, 'node')]");
                if (nodeLink != null)
                {
                    var nodeName = nodeLink.InnerText.Trim();
                    var href = nodeLink.GetAttributeValue("href", null);
                    if (!string.IsNullOrEmpty(href))
                    {
                        var match = Regex.Match(href, @"/go/([a-z0-9_-]+)");
                        if (match.Success)
                        {
                            nodeName = match.Groups[1].Value;
                        }
                    }

                    topic.Node = new V2exNodeInfo
                    {
                        Name = nodeName,
                        Title = nodeLink.GetAttributeValue("title", nodeName)
                    };
                }

                // 作者信息（Tab 页通常在 topic_info 内）
                var memberLink = item.SelectSingleNode(".//span[contains(@class, 'topic_info')]//strong//a") ??
                                item.SelectSingleNode(".//a[starts-with(@href, '/member/')]");
                if (memberLink != null)
                {
                    topic.Member = new V2exMember
                    {
                        Username = memberLink.InnerText.Trim()
                    };
                    TryFillMemberAvatarFromItem(item, topic.Member);
                }

                if (topic.Id > 0)
                {
                    topics.Add(topic);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "解析 Tab 单个话题失败");
            }
        }

        _logger.LogInformation("成功解析 {Count} 个 Tab 话题", topics.Count);
        return topics;
    }

    /// <summary>
    /// 从 Node 页 HTML 中解析话题列表（/go/{node}）
    /// </summary>
    private List<V2exTopic> ParseNodeTopicsFromHtml(string html, string nodeName)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);
        var topics = new List<V2exTopic>();

        var topicItems = document.DocumentNode.SelectNodes("//div[contains(@class, 'cell') and contains(@class, 'item')]");
        if (topicItems == null) return topics;

        foreach (var item in topicItems)
        {
            try
            {
                var topic = new V2exTopic();
                ParseTopicCommon(item, topic);

                // Node 列表页通常不重复显示节点链接，直接使用入参 nodeName。
                topic.Node = new V2exNodeInfo
                {
                    Name = nodeName,
                    Title = nodeName
                };

                // 作者信息：Node 页结构可能与 Tab 不同，因此更宽松选择器。
                var memberLink =
                    item.SelectSingleNode(".//span[contains(@class, 'topic_info')]//strong//a") ??
                    item.SelectSingleNode(".//strong//a[starts-with(@href, '/member/')]") ??
                    item.SelectSingleNode(".//a[starts-with(@href, '/member/')]");

                if (memberLink != null)
                {
                    topic.Member = new V2exMember
                    {
                        Username = memberLink.InnerText.Trim()
                    };
                    TryFillMemberAvatarFromItem(item, topic.Member);
                }

                if (topic.Id > 0)
                {
                    topics.Add(topic);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "解析 Node 单个话题失败: {NodeName}", nodeName);
            }
        }

        _logger.LogInformation("成功解析 {Count} 个 Node 话题: {NodeName}", topics.Count, nodeName);
        return topics;
    }
}
