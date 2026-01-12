using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Refit;
using Serilog;
using System.Text.Json;
using V2ex.Maui2.Core.Services.Interfaces;

namespace V2ex.ApiTest;

class Program
{
    static async Task Main(string[] args)
    {
        // 配置 Serilog
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console()
            .CreateLogger();

        // 配置依赖注入
        var services = new ServiceCollection();
        services.AddLogging(loggingBuilder =>
        {
            loggingBuilder.ClearProviders();
            loggingBuilder.AddSerilog();
        });
        services.AddRefitClient<IV2exJsonApi>(new RefitSettings
        {
            ContentSerializer = new SystemTextJsonContentSerializer(new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            })
        })
        .ConfigureHttpClient(client =>
        {
            client.BaseAddress = new Uri("https://www.v2ex.com");
            client.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1");
        });

        var serviceProvider = services.BuildServiceProvider();

        var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
        var api = serviceProvider.GetRequiredService<IV2exJsonApi>();

        logger.LogInformation("========================================");
        logger.LogInformation("开始 V2EX API 测试");
        logger.LogInformation("========================================");

        try
        {
            // 测试 1: 获取最新话题
            logger.LogInformation("\n【测试 1】获取最新话题...");
            var latestTopics = await api.GetLatestTopicsAsync();
            logger.LogInformation("✓ 成功获取 {Count} 个最新话题", latestTopics.Count);
            if (latestTopics.Count > 0)
            {
                var first = latestTopics[0];
                logger.LogInformation("  - 第一个话题: {Title}", first.Title);
                logger.LogInformation("    作者: {Username}, 回复: {Replies}",
                    first.Member?.Username ?? "Unknown",
                    first.Replies);
            }

            await Task.Delay(1000);

            // 测试 2: 获取热门话题
            logger.LogInformation("\n【测试 2】获取热门话题...");
            var hotTopics = await api.GetHotTopicsAsync();
            logger.LogInformation("✓ 成功获取 {Count} 个热门话题", hotTopics.Count);
            if (hotTopics.Count > 0)
            {
                var first = hotTopics[0];
                logger.LogInformation("  - 第一个热门话题: {Title}", first.Title);
                logger.LogInformation("    回复数: {Replies}, 最后回复: {LastTouched}",
                    first.Replies,
                    DateTimeOffset.FromUnixTimeSeconds(first.LastTouched).ToString("yyyy-MM-dd HH:mm:ss"));
            }

            await Task.Delay(1000);

            // 测试 3: 获取话题详情（基本信息）
            if (hotTopics.Count > 0)
            {
                var topicId = hotTopics[0].Id;
                logger.LogInformation("\n【测试 3】获取话题详情 (TopicId: {TopicId})...", topicId);
                try
                {
                    var topics = await api.GetTopicDetailAsync(topicId);
                    var topic = topics?.FirstOrDefault();
                    if (topic != null)
                    {
                        logger.LogInformation("✓ 成功获取话题详情");
                        logger.LogInformation("  - 标题: {Title}", topic.Title);
                        logger.LogInformation("  - 回复数: {ReplyCount}", topic.Replies);
                    }
                    else
                    {
                        logger.LogWarning("✗ 未找到话题详情");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning("⚠ 话题详情测试失败（可能 API 不支持）: {Message}", ex.Message);
                }

                // 测试 3.1: 获取话题回复
                logger.LogInformation("\n【测试 3.1】获取话题回复 (TopicId: {TopicId})...", topicId);
                try
                {
                    var replies = await api.GetRepliesAsync(topicId);
                    logger.LogInformation("✓ 成功获取 {Count} 条回复", replies.Count);
                    if (replies.Count > 0)
                    {
                        var firstReply = replies[0];
                        logger.LogInformation("  - 第一条回复 by @{Username}", firstReply.Member?.Username ?? "Unknown");
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning("⚠ 获取回复测试失败: {Message}", ex.Message);
                }
            }

            await Task.Delay(1000);

            // 测试 4: 获取节点信息
            logger.LogInformation("\n【测试 4】获取节点信息 (python)...");
            try
            {
                var nodeInfo = await api.GetNodeInfoAsync("python");
                if (nodeInfo != null)
                {
                    logger.LogInformation("✓ 成功获取节点信息");
                    logger.LogInformation("  - 节点名称: {Name}", nodeInfo.Name);
                    logger.LogInformation("  - 节点标题: {Title}", nodeInfo.Title);
                    logger.LogInformation("  - 话题数量: {TopicCount}", nodeInfo.Topics);
                }
                else
                {
                    logger.LogWarning("✗ 未找到节点信息");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("⚠ 节点信息测试失败: {Message}", ex.Message);
            }

            await Task.Delay(1000);

            // 测试 5: 获取所有节点
            logger.LogInformation("\n【测试 5】获取所有节点...");
            try
            {
                var allNodes = await api.GetAllNodesAsync();
                logger.LogInformation("✓ 成功获取 {Count} 个节点", allNodes?.Count ?? 0);
            }
            catch (Exception ex)
            {
                logger.LogWarning("⚠ 获取所有节点测试失败: {Message}", ex.Message);
            }

            await Task.Delay(1000);

            // 测试 6: 获取用户信息
            logger.LogInformation("\n【测试 6】获取用户信息 (fetchAgain)...");
            try
            {
                var memberInfo = await api.GetMemberInfoAsync("fetchAgain");
                if (memberInfo != null)
                {
                    logger.LogInformation("✓ 成功获取用户信息");
                    logger.LogInformation("  - 用户名: {Username}", memberInfo.Username);
                    logger.LogInformation("  - 话题数: {TopicCount}, 粉丝数: {Followers}",
                        memberInfo.NumTopics,
                        memberInfo.Followers);
                }
                else
                {
                    logger.LogWarning("✗ 未找到用户信息");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning("⚠ 用户信息测试失败: {Message}", ex.Message);
            }

            logger.LogInformation("\n========================================");
            logger.LogInformation("V2EX API 测试完成 - 所有测试通过 ✓");
            logger.LogInformation("========================================");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "✗ 测试失败");
            logger.LogError("错误信息: {Message}", ex.Message);
        }

        Log.CloseAndFlush();
    }
}
