using Microsoft.AspNetCore.Mvc;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
[Route("api/v2ex/topics")]
public class TopicsController : ControllerBase
{
    private readonly ILogger<TopicsController> _logger;
    private readonly ApiService _apiService;

    public TopicsController(ILogger<TopicsController> logger, ApiService apiService)
    {
        _logger = logger;
        _apiService = apiService;
    }

    [HttpGet("hot")]
    public async Task<IActionResult> GetHot()
    {
        var result = await _apiService.GetDailyHot();
        return Ok(result);
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent()
    {
        var result = await _apiService.GetRecentTopics();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTopic(int id, [FromQuery] int page = 1)
    {
        var result = await _apiService.GetTopicDetail(id, page);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTopic([FromBody] CreateTopicRequest request)
    {
        try
        {
            var result = await _apiService.PostTopic(request.Title, request.Content, request.NodeId, request.Once);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/replies/once")]
    public async Task<IActionResult> GetReplyOnceToken(int id)
    {
        try
        {
            var topicInfo = await _apiService.GetTopicDetail(id);
            if (topicInfo != null && !string.IsNullOrEmpty(topicInfo.Once))
            {
                return Ok(new { once = topicInfo.Once });
            }
            return BadRequest(new { error = "无法获取 once token" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id}/replies")]
    public async Task<IActionResult> ReplyTopic(string id, [FromBody] ReplyTopicRequest request)
    {
        try
        {
            var result = await _apiService.ReplyTopic(id, request.Content, request.Once);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/append")]
    public async Task<IActionResult> GetAppendParameter(string id)
    {
        var result = await _apiService.GetAppendTopicParameter(id);
        return Ok(result);
    }

    [HttpPost("{id}/append")]
    public async Task<IActionResult> AppendTopic(string id, [FromBody] AppendTopicRequest request)
    {
        var result = await _apiService.AppendTopic(id, request.Once, request.Content);
        return Ok(result);
    }

    [HttpPost("{id}/thank")]
    public async Task<IActionResult> ThankTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.ThankCreator(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/ignore")]
    public async Task<IActionResult> IgnoreTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.IgnoreTopic(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/unignore")]
    public async Task<IActionResult> UnignoreTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.UnignoreTopic(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/favorite")]
    public async Task<IActionResult> FavoriteTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.FavoriteTopic(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/unfavorite")]
    public async Task<IActionResult> UnfavoriteTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.UnfavoriteTopic(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/up")]
    public async Task<IActionResult> UpTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.UpTopic(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/down")]
    public async Task<IActionResult> DownTopic(string id, [FromQuery] string once)
    {
        var result = await _apiService.DownTopic(id, once);
        return Ok(result);
    }
}

public class CreateTopicRequest
{
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string NodeId { get; set; } = "";
    public string Once { get; set; } = "";
}

public class ReplyTopicRequest
{
    public string Content { get; set; } = "";
    public string Once { get; set; } = "";
}

public class AppendTopicRequest
{
    public string Content { get; set; } = "";
    public string Once { get; set; } = "";
}
