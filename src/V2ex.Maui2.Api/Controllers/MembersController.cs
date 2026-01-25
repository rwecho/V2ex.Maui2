using Microsoft.AspNetCore.Mvc;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
[Route("api/v2ex/members")]
public class MembersController : ControllerBase
{
    private readonly ILogger<MembersController> _logger;
    private readonly ApiService _apiService;

    public MembersController(ILogger<MembersController> logger, ApiService apiService)
    {
        _logger = logger;
        _apiService = apiService;
    }

    [HttpGet("{username}")]
    public async Task<IActionResult> GetMember([FromRoute] string username)
    {
        var result = await _apiService.GetMemberInfo(username);
        return Ok(result);
    }

    [HttpGet("{username}/page")]
    public async Task<IActionResult> GetMemberPage([FromRoute] string username)
    {
        var result = await _apiService.GetUserPageInfo(username);
        return Ok(result);
    }

    [HttpPost("follow")]
    public async Task<IActionResult> FollowUser([FromQuery] string url)
    {
        var result = await _apiService.FollowUser(url);
        return Ok(result);
    }

    [HttpPost("block")]
    public async Task<IActionResult> BlockUser([FromQuery] string url)
    {
        var result = await _apiService.BlockUser(url);
        return Ok(result);
    }
}
