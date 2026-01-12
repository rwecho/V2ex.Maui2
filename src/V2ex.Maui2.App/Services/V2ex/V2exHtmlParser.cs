using AngleSharp;
using AngleSharp.Dom;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.App.Models.V2ex;
using V2ex.Maui2.App.Services.Interfaces;
using V2Node = V2ex.Maui2.App.Models.V2ex.Node;

namespace V2ex.Maui2.App.Services.V2ex;

/// <summary>
/// V2EX HTML 解析器实现
/// </summary>
public class V2exHtmlParser : IHtmlParser
{
    private readonly IBrowsingContext _context;
    private readonly ILogger<V2exHtmlParser> _logger;

    public V2exHtmlParser(ILogger<V2exHtmlParser> logger)
    {
        _logger = logger;
        var config = Configuration.Default.WithDefaultLoader();
        _context = BrowsingContext.New(config);
    }

    public Task<List<Topic>> ParseTopicListAsync(string html)
    {
        try
        {
            var document = _context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
            var topics = new List<Topic>();

            // V2EX 首页话题列表选择器
            var topicCells = document.QuerySelectorAll("#TopicsNode .cell, #Main .cell.item");

            foreach (var cell in topicCells)
            {
                try
                {
                    var topic = new Topic();

                    // 获取标题和链接
                    var titleElement = cell.QuerySelector(".topic-title");
                    if (titleElement != null)
                    {
                        topic.Title = titleElement.TextContent.Trim();
                        var linkElement = titleElement.QuerySelector("a");
                        if (linkElement != null)
                        {
                            topic.Url = linkElement.GetAttribute("href") ?? string.Empty;
                            // 从 URL 中提取话题 ID
                            // 例如: /t/12345#reply123
                            var parts = topic.Url.Split('/', StringSplitOptions.RemoveEmptyEntries);
                            if (parts.Length > 1)
                            {
                                topic.Id = parts[1].Split('#')[0];
                            }
                        }
                    }

                    // 获取作者信息
                    var authorElement = cell.QuerySelector(".user-info a");
                    if (authorElement != null)
                    {
                        topic.Author = authorElement.TextContent.Trim();
                    }

                    // 获取头像
                    var avatarElement = cell.QuerySelector(".avatar");
                    if (avatarElement != null)
                    {
                        topic.Avatar = avatarElement.GetAttribute("src") ?? string.Empty;
                    }

                    // 获取节点信息
                    var nodeElement = cell.QuerySelector(".node a");
                    if (nodeElement != null)
                    {
                        topic.NodeTitle = nodeElement.TextContent.Trim();
                        topic.NodeName = nodeElement.GetAttribute("href")?.Replace("/go/", "") ?? string.Empty;
                    }

                    // 获取回复数
                    var countElement = cell.QuerySelector(".count-livid, .count-orange");
                    if (countElement != null)
                    {
                        if (int.TryParse(countElement.TextContent.Trim(), out var replyCount))
                        {
                            topic.ReplyCount = replyCount;
                        }
                    }

                    // 获取最后回复时间
                    var timeElement = cell.QuerySelector(".last-reply-time, .ago");
                    if (timeElement != null)
                    {
                        var timeText = timeElement.TextContent.Trim();
                        topic.LastReplyTime = ParseRelativeTime(timeText);
                    }

                    if (!string.IsNullOrEmpty(topic.Id))
                    {
                        topics.Add(topic);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "解析单个话题时出错");
                }
            }

            return Task.FromResult(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析话题列表时出错");
            return Task.FromResult(new List<Topic>());
        }
    }

    public Task<Topic> ParseTopicDetailAsync(string html)
    {
        try
        {
            var document = _context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
            var topic = new Topic();

            // 获取标题
            var titleElement = document.QuerySelector(".header h1");
            if (titleElement != null)
            {
                topic.Title = titleElement.TextContent.Trim();
            }

            // 获取内容
            var contentElement = document.QuerySelector(".topic_content");
            if (contentElement != null)
            {
                topic.Content = contentElement.InnerHtml;
            }

            // 获取作者信息
            var authorElement = document.QuerySelector(".header .user-info a");
            if (authorElement != null)
            {
                topic.Author = authorElement.TextContent.Trim();
            }

            // 获取节点信息
            var nodeElement = document.QuerySelector(".header .node a");
            if (nodeElement != null)
            {
                topic.NodeTitle = nodeElement.TextContent.Trim();
                topic.NodeName = nodeElement.GetAttribute("href")?.Replace("/go/", "") ?? string.Empty;
            }

            return Task.FromResult(topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析话题详情时出错");
            return Task.FromResult(new Topic());
        }
    }

    public Task<List<Comment>> ParseCommentListAsync(string html)
    {
        try
        {
            var document = _context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
            var comments = new List<Comment>();

            // V2EX 评论列表选择器
            var replyCells = document.QuerySelectorAll("#Main .box .reply");

            int floor = 0;
            foreach (var cell in replyCells)
            {
                try
                {
                    floor++;
                    var comment = new Comment { Floor = floor };

                    // 获取评论 ID
                    comment.Id = cell.GetAttribute("id")?.Replace("reply_", "") ?? string.Empty;

                    // 获取用户名
                    var userElement = cell.QuerySelector(".user-info a");
                    if (userElement != null)
                    {
                        comment.Username = userElement.TextContent.Trim();
                    }

                    // 获取头像
                    var avatarElement = cell.QuerySelector(".avatar");
                    if (avatarElement != null)
                    {
                        comment.Avatar = avatarElement.GetAttribute("src") ?? string.Empty;
                    }

                    // 获取评论内容
                    var contentElement = cell.QuerySelector(".reply-content");
                    if (contentElement != null)
                    {
                        comment.Content = contentElement.InnerHtml;
                    }

                    // 获取时间
                    var timeElement = cell.QuerySelector(".ago");
                    if (timeElement != null)
                    {
                        var timeText = timeElement.TextContent.Trim();
                        comment.CreatedAt = ParseRelativeTime(timeText);
                    }

                    // 检查是否为作者（通过 .op 标记）
                    if (cell.ClassList.Contains("op"))
                    {
                        comment.IsAuthor = true;
                    }

                    // 获取感谢数
                    var thankElement = cell.QuerySelector(".thank-area a");
                    if (thankElement != null)
                    {
                        var thankText = thankElement.TextContent.Trim();
                        if (int.TryParse(thankText, out var thankCount))
                        {
                            comment.ThankCount = thankCount;
                        }
                    }

                    if (!string.IsNullOrEmpty(comment.Id))
                    {
                        comments.Add(comment);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "解析单个评论时出错");
                }
            }

            return Task.FromResult(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析评论列表时出错");
            return Task.FromResult(new List<Comment>());
        }
    }

    public Task<User> ParseUserProfileAsync(string html)
    {
        try
        {
            var document = _context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
            var user = new User();

            // 获取用户名
            var usernameElement = document.QuerySelector(".user-info a");
            if (usernameElement != null)
            {
                user.Username = usernameElement.TextContent.Trim();
            }

            // 获取头像
            var avatarElement = document.QuerySelector(".user-info img");
            if (avatarElement != null)
            {
                user.Avatar = avatarElement.GetAttribute("src") ?? string.Empty;
            }

            // 获取个人简介
            var bioElement = document.QuerySelector(".user-bio");
            if (bioElement != null)
            {
                user.Bio = bioElement.TextContent.Trim();
            }

            // 获取位置
            var locationElement = document.QuerySelector(".user-location");
            if (locationElement != null)
            {
                user.Location = locationElement.TextContent.Trim();
            }

            // 获取网站
            var websiteElement = document.QuerySelector(".user-website a");
            if (websiteElement != null)
            {
                user.Website = websiteElement.GetAttribute("href") ?? string.Empty;
            }

            // 获取 GitHub
            var githubElement = document.QuerySelector(".user-github a");
            if (githubElement != null)
            {
                user.GitHub = githubElement.TextContent.Trim();
            }

            return Task.FromResult(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析用户信息时出错");
            return Task.FromResult(new User());
        }
    }

    public Task<List<V2Node>> ParseNodeListAsync(string html)
    {
        try
        {
            var document = _context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
            var nodes = new List<V2Node>();

            // V2EX 节点列表选择器
            var nodeCells = document.QuerySelectorAll(".grid-cell");

            foreach (var cell in nodeCells)
            {
                try
                {
                    var node = new V2Node();

                    // 获取节点名称和标题
                    var linkElement = cell.QuerySelector("a");
                    if (linkElement != null)
                    {
                        var href = linkElement.GetAttribute("href") ?? "";
                        node.Name = href.Replace("/go/", "");

                        var titleElement = cell.QuerySelector(".title");
                        if (titleElement != null)
                        {
                            node.Title = titleElement.TextContent.Trim();
                        }
                    }

                    // 获取图标
                    var iconElement = cell.QuerySelector(".icon");
                    if (iconElement != null)
                    {
                        var img = iconElement.QuerySelector("img");
                        if (img != null)
                        {
                            node.Icon = img.GetAttribute("src") ?? string.Empty;
                        }
                    }

                    // 获取描述
                    var descElement = cell.QuerySelector(".description");
                    if (descElement != null)
                    {
                        node.Description = descElement.TextContent.Trim();
                    }

                    // 获取话题数
                    var countElement = cell.QuerySelector(".count");
                    if (countElement != null)
                    {
                        var countText = countElement.TextContent.Replace("topics", "").Trim();
                        if (int.TryParse(countText, out var count))
                        {
                            node.TopicCount = count;
                        }
                    }

                    if (!string.IsNullOrEmpty(node.Name))
                    {
                        nodes.Add(node);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "解析单个节点时出错");
                }
            }

            return Task.FromResult(nodes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析节点列表时出错");
            return Task.FromResult(new List<V2Node>());
        }
    }

    public Task<V2Node> ParseNodeDetailAsync(string html)
    {
        try
        {
            var document = _context.OpenAsync(req => req.Content(html)).GetAwaiter().GetResult();
            var node = new V2Node();

            // 获取节点名称
            var nameElement = document.QuerySelector(".header .node a");
            if (nameElement != null)
            {
                node.Name = nameElement.GetAttribute("href")?.Replace("/go/", "") ?? string.Empty;
                node.Title = nameElement.TextContent.Trim();
            }

            // 获取描述
            var descElement = document.QuerySelector(".node-description");
            if (descElement != null)
            {
                node.Description = descElement.TextContent.Trim();
            }

            // 获取图标
            var iconElement = document.QuerySelector(".node-icon img");
            if (iconElement != null)
            {
                node.Icon = iconElement.GetAttribute("src") ?? string.Empty;
            }

            // 获取头部图片
            var headerElement = document.QuerySelector(".node-header");
            if (headerElement != null)
            {
                node.Header = headerElement.GetAttribute("src") ?? string.Empty;
            }

            return Task.FromResult(node);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析节点详情时出错");
            return Task.FromResult(new V2Node());
        }
    }

    /// <summary>
    /// 解析相对时间（例如："3分钟前"、"2小时前"）
    /// </summary>
    private DateTime ParseRelativeTime(string timeText)
    {
        try
        {
            if (timeText.Contains("秒"))
            {
                var seconds = int.Parse(timeText.Replace("秒前", "").Trim());
                return DateTime.Now.AddSeconds(-seconds);
            }
            else if (timeText.Contains("分钟"))
            {
                var minutes = int.Parse(timeText.Replace("分钟前", "").Trim());
                return DateTime.Now.AddMinutes(-minutes);
            }
            else if (timeText.Contains("小时"))
            {
                var hours = int.Parse(timeText.Replace("小时前", "").Trim());
                return DateTime.Now.AddHours(-hours);
            }
            else if (timeText.Contains("天"))
            {
                var days = int.Parse(timeText.Replace("天前", "").Trim());
                return DateTime.Now.AddDays(-days);
            }
        }
        catch
        {
            // 如果解析失败，返回当前时间
        }

        return DateTime.Now;
    }
}
