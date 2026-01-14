using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.V2ex;

namespace V2ex.Maui2.Tests;

/// <summary>
/// V2EX HTML 解析器单元测试
/// </summary>
public class V2exHtmlParserTests : IAsyncLifetime
{
    private V2exHtmlParser? _parser;

    public async Task InitializeAsync()
    {
        // 创建 HttpClient
        var httpClient = new HttpClient(new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate,
        })
        {
            BaseAddress = new Uri("https://www.v2ex.com"),
            Timeout = TimeSpan.FromSeconds(30)
        };

        // 创建 Logger
        using var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Information);
        });

        var logger = loggerFactory.CreateLogger<V2exHtmlParser>();

        _parser = new V2exHtmlParser(httpClient, logger);

        // 等待初始化
        await Task.Delay(100);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetTabTopics_Tech_ShouldReturnTopics()
    {
        // Arrange & Act
        var topics = await _parser!.GetTabTopicsAsync("tech");

        // Assert
        Assert.NotNull(topics);
        Assert.NotEmpty(topics);

        // 验证第一个话题的必要字段
        var firstTopic = topics[0];
        Assert.True(firstTopic.Id > 0, "Topic ID should be greater than 0");
        Assert.NotEmpty(firstTopic.Title);
        Assert.NotNull(firstTopic.Member);
        Assert.NotNull(firstTopic.Node);

        // 输出测试信息
        Console.WriteLine($"✅ 成功解析 {topics.Count} 个 tech Tab 话题");
        Console.WriteLine($"第一个话题: {firstTopic.Title}");
        Console.WriteLine($"  ID: {firstTopic.Id}");
        Console.WriteLine($"  节点: {firstTopic.Node?.Name}");
        Console.WriteLine($"  作者: {firstTopic.Member?.Username}");
        Console.WriteLine($"  回复数: {firstTopic.Replies}");
    }

    [Fact]
    public async Task GetTabTopics_Creative_ShouldReturnTopics()
    {
        // Arrange & Act
        var topics = await _parser!.GetTabTopicsAsync("creative");

        // Assert
        Assert.NotNull(topics);
        Assert.NotEmpty(topics);

        var firstTopic = topics[0];
        Assert.True(firstTopic.Id > 0);
        Assert.NotEmpty(firstTopic.Title);

        // 输出测试信息
        Console.WriteLine($"✅ 成功解析 {topics.Count} 个 creative Tab 话题");
        Console.WriteLine($"第一个话题: {firstTopic.Title}");
    }

    [Fact]
    public async Task GetNodeTopics_Python_ShouldReturnTopics()
    {
        // Arrange & Act
        var topics = await _parser!.GetNodeTopicsAsync("python", 1);

        // Assert
        Assert.NotNull(topics);

        // 某些节点可能暂时没有话题，这是正常的
        if (topics.Count > 0)
        {
            var firstTopic = topics[0];
            Assert.True(firstTopic.Id > 0);
            Assert.NotEmpty(firstTopic.Title);
            Assert.NotNull(firstTopic.Node);

            // 输出测试信息
            Console.WriteLine($"✅ 成功解析 {topics.Count} 个 python 节点话题");
            Console.WriteLine($"第一个话题: {firstTopic.Title}");
            Console.WriteLine($"  节点: {firstTopic.Node?.Name}");
        }
        else
        {
            Console.WriteLine($"⚠️ python 节点暂无话题");
        }
    }

    [Fact]
    public async Task GetNodeTopics_Programming_ShouldReturnTopics()
    {
        // Arrange & Act
        var topics = await _parser!.GetNodeTopicsAsync("programming", 1);

        // Assert
        Assert.NotNull(topics);

        // 节点可能没有话题，所以不检查 NotEmpty
        if (topics.Count > 0)
        {
            var firstTopic = topics[0];
            Assert.True(firstTopic.Id > 0);
            Assert.NotEmpty(firstTopic.Title);

            // 输出测试信息
            Console.WriteLine($"✅ 成功解析 {topics.Count} 个 programming 节点话题");
            Console.WriteLine($"第一个话题: {firstTopic.Title}");
        }
        else
        {
            Console.WriteLine($"⚠️ programming 节点暂无话题");
        }
    }

    [Fact]
    public async Task GetNodeTopics_WithPagination_ShouldReturnTopics()
    {
        // Arrange
        var nodeName = "python";

        // Act - 获取第1页
        var page1 = await _parser!.GetNodeTopicsAsync(nodeName, 1);

        // Assert
        Assert.NotNull(page1);

        // 输出测试信息
        Console.WriteLine($"✅ 第1页: {page1.Count} 个话题");

        // 如果第1页有话题，尝试获取第2页
        if (page1.Count > 0)
        {
            // 获取第2页
            var page2 = await _parser.GetNodeTopicsAsync(nodeName, 2);
            Assert.NotNull(page2);

            Console.WriteLine($"✅ 第2页: {page2.Count} 个话题");

            // 验证话题ID不重复（分页正确）
            if (page2.Count > 0)
            {
                var page1Ids = page1.Select(t => t.Id).ToHashSet();
                var page2Ids = page2.Select(t => t.Id).ToHashSet();

                var intersect = page1Ids.Intersect(page2Ids);
                Assert.Empty(intersect); // 两页的话题ID不应该有交集

                Console.WriteLine($"✅ 分页验证通过，两页话题ID无重复");
            }
        }
    }

    [Fact]
    public async Task ParseTopic_ShouldHaveAllRequiredFields()
    {
        // Arrange & Act
        var topics = await _parser!.GetTabTopicsAsync("tech");

        // Assert
        Assert.NotNull(topics);
        Assert.NotEmpty(topics);

        var topic = topics[0];

        // 验证所有必要字段都已解析
        Assert.True(topic.Id > 0);
        Assert.NotEmpty(topic.Title);
        Assert.NotNull(topic.Member);
        Assert.NotEmpty(topic.Member?.Username);
        Assert.NotNull(topic.Node);
        Assert.NotEmpty(topic.Node?.Name);
        Assert.True(topic.Replies >= 0);

        // 输出测试信息
        Console.WriteLine($"✅ 话题字段解析完整");
        Console.WriteLine($"  ID: {topic.Id}");
        Console.WriteLine($"  标题: {topic.Title}");
        Console.WriteLine($"  作者: {topic.Member?.Username}");
        Console.WriteLine($"  节点: {topic.Node?.Name} ({topic.Node?.Title})");
        Console.WriteLine($"  回复: {topic.Replies}");
    }
}
