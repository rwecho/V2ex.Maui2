using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Refit;
using V2ex.Maui2.Core.Models.Api;
using V2ex.Maui2.Core.Services.Interfaces;

namespace V2ex.Maui2.Api.Controllers;

[Route("api/v2ex/members")]
[EnableRateLimiting("per-ip")]
public class MembersController : ApiControllerBase
{
    private readonly IV2exJsonApi _v2ex;
    private readonly ILogger<MembersController> _logger;

    public MembersController(IV2exJsonApi v2ex, ILogger<MembersController> logger)
    {
        _v2ex = v2ex;
        _logger = logger;
    }

    [HttpGet("{username}")]
    public async Task<ActionResult<V2exMember>> GetMember([FromRoute] string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid username");
        }

        try
        {
            var member = await _v2ex.GetMemberInfoAsync(username);
            return Ok(member);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "V2EX API error while fetching member {Username}", username);
            return UpstreamProblem(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching member {Username}", username);
            return Problem(statusCode: StatusCodes.Status502BadGateway, title: ex.Message);
        }
    }
}
