using Microsoft.Extensions.Logging;
using Refit;
using System.Text.Json;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.Interfaces;

namespace V2ex.Maui2.Tests;

/// <summary>
/// V2EX JSON API 单元测试
/// </summary>
public class V2ExJsonApiTests : IAsyncLifetime
{
    private IV2exJsonApi? _api;

    public async Task InitializeAsync()
    {
        // 配置 Refit HTTP 客户端
        var v2exJsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        var settings = new RefitSettings
        {
            ContentSerializer = new SystemTextJsonContentSerializer(v2exJsonOptions)
        };

        _api = RestService.For<IV2exJsonApi>("https://www.v2ex.com", settings);

        // 等待一下确保客户端初始化完成
        await Task.Delay(100);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetLatestTopics_ShouldReturnTopics()
    {
        // Arrange & Act
        var topics = await _api!.GetLatestTopicsAsync();

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
        Console.WriteLine($"✅ 获取到 {topics.Count} 个最新话题");
        Console.WriteLine($"第一个话题: {firstTopic.Title} (ID: {firstTopic.Id})");
    }

    [Fact]
    public async Task GetHotTopics_ShouldReturnTopics()
    {
        // Arrange & Act
        var topics = await _api!.GetHotTopicsAsync();

        // Assert
        Assert.NotNull(topics);
        Assert.NotEmpty(topics);

        var firstTopic = topics[0];
        Assert.True(firstTopic.Id > 0);
        Assert.NotEmpty(firstTopic.Title);

        // 输出测试信息
        Console.WriteLine($"✅ 获取到 {topics.Count} 个热门话题");
        Console.WriteLine($"第一个热门话题: {firstTopic.Title}");
    }

    [Fact]
    public async Task GetAllNodes_ShouldReturnNodes()
    {
        // Arrange & Act
        var nodes = await _api!.GetAllNodesAsync();

        // Assert
        Assert.NotNull(nodes);
        Assert.NotEmpty(nodes);

        var firstNode = nodes[0];
        Assert.NotEmpty(firstNode.Name);
        Assert.NotEmpty(firstNode.Title);

        // 输出测试信息
        Console.WriteLine($"✅ 获取到 {nodes.Count} 个节点");
        Console.WriteLine($"第一个节点: {firstNode.Title} ({firstNode.Name})");
    }

    [Fact]
    public async Task GetTopicDetail_ShouldReturnTopic()
    {
        // Arrange
        var topicId = 1185086; // 使用已知存在的话题 ID

        // Act
        var topics = await _api!.GetTopicDetailAsync(topicId);

        // Assert
        Assert.NotNull(topics);
        Assert.Single(topics);

        var topic = topics[0];
        Assert.Equal(topicId, topic.Id);
        Assert.NotEmpty(topic.Title);

        // 输出测试信息
        Console.WriteLine($"✅ 获取话题详情成功");
        Console.WriteLine($"话题: {topic.Title}");
    }

    [Fact]
    public async Task GetNodeInfo_ShouldReturnNode()
    {
        // Arrange
        var nodeName = "python";

        // Act
        var node = await _api!.GetNodeInfoAsync(nodeName);

        // Assert
        Assert.NotNull(node);
        Assert.Equal(nodeName, node.Name);
        Assert.NotEmpty(node.Title);

        // 输出测试信息
        Console.WriteLine($"✅ 获取节点详情成功");
        Console.WriteLine($"节点: {node.Title} ({node.Name})");
        Console.WriteLine($"话题数: {node.Topics}");
    }

    [Fact]
    public async Task GetMemberInfo_ShouldReturnMember()
    {
        // Arrange
        var username = "Livid"; // V2EX 创始人

        // Act
        var member = await _api!.GetMemberInfoAsync(username);

        // Assert
        Assert.NotNull(member);
        Assert.Equal(username, member.Username);

        // 输出测试信息
        Console.WriteLine($"✅ 获取用户信息成功");
        Console.WriteLine($"用户: {member.Username}");
    }

    [Fact]
    public async Task GetReplies_ShouldReturnReplies()
    {
        // Arrange
        var topicId = 1185086;

        // Act
        var replies = await _api!.GetRepliesAsync(topicId);

        // Assert
        Assert.NotNull(replies);
        // 回复可能为空，但不应该抛出异常

        // 输出测试信息
        Console.WriteLine($"✅ 获取回复列表成功");
        Console.WriteLine($"回复数: {replies.Count}");
    }
}
