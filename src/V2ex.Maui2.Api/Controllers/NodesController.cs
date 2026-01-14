using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Refit;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.Interfaces;
using V2ex.Maui2.Core.Services.V2ex;

namespace V2ex.Maui2.Api.Controllers;

[Route("api/v2ex/nodes")]
[EnableRateLimiting("per-ip")]
public class NodesController : ApiControllerBase
{
    private readonly IV2exJsonApi _v2ex;
    private readonly V2exJsonService _v2exService;
    private readonly ILogger<NodesController> _logger;

    public NodesController(IV2exJsonApi v2ex, V2exJsonService v2exService, ILogger<NodesController> logger)
    {
        _v2ex = v2ex;
        _v2exService = v2exService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<V2exNodeInfo>>> GetAll()
    {
        try
        {
            var nodes = await _v2ex.GetAllNodesAsync();
            return Ok(nodes);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching nodes");
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching nodes");
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }

    [HttpGet("{nodeName}")]
    public async Task<ActionResult<V2exNodeInfo>> GetNode([FromRoute] string nodeName)
    {
        if (string.IsNullOrWhiteSpace(nodeName))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid nodeName");
        }

        try
        {
            var node = await _v2ex.GetNodeInfoAsync(nodeName);
            return Ok(node);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching node {NodeName}", nodeName);
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching node {NodeName}", nodeName);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }

    [HttpGet("{nodeName}/topics")]
    public async Task<ActionResult<List<V2exTopic>>> GetNodeTopics(
        [FromRoute] string nodeName,
        [FromQuery] int? page)
    {
        if (string.IsNullOrWhiteSpace(nodeName))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid nodeName");
        }

        try
        {
            _logger.LogInformation("Fetching topics for node: {NodeName}, page: {Page}", nodeName, page ?? 1);

            // 使用 V2exJsonService 的 HTML 解析方法
            var topics = await _v2exService.GetNodeTopicsAsync(nodeName, page ?? 1);

            _logger.LogInformation("Successfully fetched {Count} topics for node: {NodeName}", topics.Count, nodeName);

            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching topics for node: {NodeName}", nodeName);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }
}
