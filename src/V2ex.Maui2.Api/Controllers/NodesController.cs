using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Refit;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.Interfaces;

namespace V2ex.Maui2.Api.Controllers;

[Route("api/v2ex/nodes")]
[EnableRateLimiting("per-ip")]
public class NodesController : ApiControllerBase
{
    private readonly IV2exJsonApi _v2ex;
    private readonly ILogger<NodesController> _logger;

    public NodesController(IV2exJsonApi v2ex, ILogger<NodesController> logger)
    {
        _v2ex = v2ex;
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
            var topics = await _v2ex.GetNodeTopicsAsync(nodeName, page);
            return Ok(topics);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching node topics for {NodeName}", nodeName);
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching node topics for {NodeName}", nodeName);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }
}
