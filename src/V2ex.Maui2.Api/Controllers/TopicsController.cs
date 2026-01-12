using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Refit;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.Interfaces;

namespace V2ex.Maui2.Api.Controllers;

[Route("api/v2ex/topics")]
[EnableRateLimiting("per-ip")]
public class TopicsController : ApiControllerBase
{
    private readonly IV2exJsonApi _v2ex;
    private readonly ILogger<TopicsController> _logger;

    public TopicsController(IV2exJsonApi v2ex, ILogger<TopicsController> logger)
    {
        _v2ex = v2ex;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<V2exTopic>>> GetLatest([FromQuery] int? page)
    {
        try
        {
            var topics = await _v2ex.GetLatestTopicsAsync();
            return Ok(topics);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching latest topics");
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching latest topics");
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }

    [HttpGet("hot")]
    public async Task<ActionResult<List<V2exTopic>>> GetHot()
    {
        try
        {
            var topics = await _v2ex.GetHotTopicsAsync();
            return Ok(topics);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching hot topics");
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching hot topics");
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }

    [HttpGet("{topicId:int}")]
    public async Task<ActionResult<V2exTopicDetail>> GetTopic([FromRoute] int topicId)
    {
        if (topicId <= 0)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid topicId");
        }

        try
        {
            var topicTask = _v2ex.GetTopicDetailAsync(topicId);
            var repliesTask = _v2ex.GetRepliesAsync(topicId);
            await Task.WhenAll(topicTask, repliesTask);

            var topics = await topicTask;
            var topic = topics?.FirstOrDefault();
            if (topic is null)
            {
                return NotFound();
            }

            var detail = new V2exTopicDetail
            {
                Topic = topic,
                Replies = await repliesTask,
                Page = 1,
                TotalPages = 1,
            };

            return Ok(detail);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching topic detail {TopicId}", topicId);
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching topic detail {TopicId}", topicId);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }

    [HttpGet("{topicId:int}/replies")]
    public async Task<ActionResult<List<V2exReply>>> GetReplies([FromRoute] int topicId)
    {
        if (topicId <= 0)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid topicId");
        }

        try
        {
            var replies = await _v2ex.GetRepliesAsync(topicId);
            return Ok(replies);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching replies for topic {TopicId}", topicId);
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching replies for topic {TopicId}", topicId);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }
}
