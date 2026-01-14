using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.V2ex;

namespace V2ex.Maui2.Api.Controllers;

/// <summary>
/// V2EX Tab 话题 API
/// </summary>
[Route("api/v2ex/tabs")]
[EnableRateLimiting("per-ip")]
public class TabsController : ControllerBase
{
    private readonly V2exJsonService _v2exService;
    private readonly ILogger<TabsController> _logger;

    public TabsController(V2exJsonService v2exService, ILogger<TabsController> logger)
    {
        _v2exService = v2exService;
        _logger = logger;
    }

    /// <summary>
    /// 获取指定 Tab 的话题列表
    /// </summary>
    /// <param name="tab">Tab 名称 (例如: tech, creative, play, apple, jobs)</param>
    /// <returns>话题列表</returns>
    /// <remarks>
    /// 常见的 Tab 值：
    /// - tech: 技术
    /// - creative: 创作
    /// - play: 玩物
    /// - apple: 苹果
    /// - jobs: 酷工作
    /// - deals: 好价
    /// - city: 城市
    /// - qna: 问与答
    /// - nodes: 节点
    /// </remarks>
    [HttpGet("{tab}")]
    public async Task<ActionResult<List<V2exTopic>>> GetTabTopics([FromRoute] string tab)
    {
        if (string.IsNullOrWhiteSpace(tab))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid tab");
        }

        try
        {
            _logger.LogInformation("Fetching topics for tab: {Tab}", tab);

            var topics = await _v2exService.GetTabTopicsAsync(tab);

            _logger.LogInformation("Successfully fetched {Count} topics for tab: {Tab}", topics.Count, tab);

            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching topics for tab: {Tab}", tab);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }
}
