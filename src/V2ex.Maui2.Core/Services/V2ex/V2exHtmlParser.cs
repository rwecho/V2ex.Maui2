using AngleSharp.Html.Parser;
using Microsoft.Extensions.Logging;
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

            return ParseTopicsFromHtml(html);
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

            return ParseTopicsFromHtml(html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析节点页面失败: {NodeName}, 页码: {Page}", nodeName, page);
            throw;
        }
    }

    /// <summary>
    /// 从 HTML 中解析话题列表
    /// </summary>
    private List<V2exTopic> ParseTopicsFromHtml(string html)
    {
        var parser = new HtmlParser();
        var document = parser.ParseDocument(html);
        var topics = new List<V2exTopic>();

        // 查找所有话题项: <div class="cell item">
        var topicItems = document.QuerySelectorAll("div.cell.item");

        foreach (var item in topicItems)
        {
            try
            {
                var topic = new V2exTopic();

                // 提取标题和链接
                var titleLink = item.QuerySelector("span.item_title a.topic-link");
                if (titleLink != null)
                {
                    topic.Title = titleLink.TextContent.Trim();
                    var href = titleLink.GetAttribute("href");
                    // 或直接链接: /t/1185086#reply4
                    if (!string.IsNullOrEmpty(href))
                    {
                        // 从 URL 中提取话题 ID
                        var match = System.Text.RegularExpressions.Regex.Match(href, @"/t/(\d+)");
                        if (match.Success && int.TryParse(match.Groups[1].Value, out var topicId))
                        {
                            topic.Id = topicId;
                        }
                    }
                }

                // 提取节点信息
                var nodeLink = item.QuerySelector("span.topic_info a.node");
                if (nodeLink != null)
                {
                    var nodeName = nodeLink.TextContent.Trim();
                    var href = nodeLink.GetAttribute("href");
                    if (!string.IsNullOrEmpty(href))
                    {
                        var match = System.Text.RegularExpressions.Regex.Match(href, @"/go/([a-z0-9_-]+)");
                        if (match.Success)
                        {
                            nodeName = match.Groups[1].Value;
                        }
                    }

                    topic.Node = new V2exNodeInfo
                    {
                        Name = nodeName,
                        Title = nodeLink.GetAttribute("title") ?? nodeName
                    };
                }

                // 提取作者信息
                var memberLink = item.QuerySelector("span.topic_info strong a");
                if (memberLink != null)
                {
                    topic.Member = new V2exMember
                    {
                        Username = memberLink.TextContent.Trim()
                    };
                }

                // 提取回复数
                var replyCountLink = item.QuerySelector("td[align=\"right\"] a.count_livid, a.count_livid");
                if (replyCountLink != null)
                {
                    var countText = replyCountLink.TextContent.Trim();
                    if (int.TryParse(countText, out var replies))
                    {
                        topic.Replies = replies;
                    }
                }

                // 提取创建时间（V2EX 使用相对时间，暂时设置为 0）
                topic.Created = 0;
                topic.LastModified = 0;
                topic.LastTouched = 0;

                // 只有有效的 ID 才添加到列表
                if (topic.Id > 0)
                {
                    topics.Add(topic);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "解析单个话题失败");
            }
        }

        _logger.LogInformation("成功解析 {Count} 个话题", topics.Count);
        return topics;
    }
}
