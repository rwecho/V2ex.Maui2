using Microsoft.AspNetCore.Mvc;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
[Route("api/v2ex/account")]
public class AccountController : ControllerBase
{
    private readonly ILogger<AccountController> _logger;
    private readonly ApiService _apiService;

    public AccountController(ILogger<AccountController> logger, ApiService apiService)
    {
        _logger = logger;
        _apiService = apiService;
    }

    [HttpGet("login-parameters")]
    public async Task<IActionResult> GetLoginParameters()
    {
        var result = await _apiService.GetLoginParameters();
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var result = await _apiService.Login(request.Parameters, request.Username, request.Password, request.Captcha);
            return Ok(new
            {
                success = true,
                username = request.Username,
                message = "登录成功",
                currentUser = result.CurrentUser
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            _apiService.SignOut();
            return Ok(new
            {
                success = true,
                message = "退出成功"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("2fa")]
    public async Task<IActionResult> TwoStep([FromBody] TwoStepRequest request)
    {
        var result = await _apiService.SignInTwoStep(request.Code, request.Once);
        return Ok(result);
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyInfo()
    {
        var result = await _apiService.GetDailyInfo();
        return Ok(result);
    }

    [HttpPost("daily/checkin")]
    public async Task<IActionResult> CheckIn([FromQuery] string once)
    {
        var result = await _apiService.CheckIn(once);
        return Ok(result);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1)
    {
        var result = await _apiService.GetNotifications(page);
        return Ok(result);
    }

    [HttpGet("following")]
    public async Task<IActionResult> GetFollowing([FromQuery] int page = 1)
    {
        var result = await _apiService.GetFollowingInfo(page);
        return Ok(result);
    }

    [HttpGet("favorite/topics")]
    public async Task<IActionResult> GetFavoriteTopics([FromQuery] int page = 1)
    {
        var result = await _apiService.GetFavoriteTopics(page);
        return Ok(result);
    }

    [HttpGet("favorite/nodes")]
    public async Task<IActionResult> GetFavoriteNodes()
    {
        var result = await _apiService.GetFavoriteNodes();
        return Ok(result);
    }

    [HttpGet("captcha")]
    public async Task<IActionResult> GetCaptcha([FromQuery] string once)
    {
        var result = await _apiService.GetCaptchaImage(once);
        return File(result, "image/png");
    }
    [HttpGet("logged-in")]
    public async Task<IActionResult> LoggedIn()
    {
        var dailyInfo = await _apiService.GetDailyInfo();
        return Ok(new
        {
            isLoggedIn = dailyInfo?.CurrentUser != null
        });
    }

    [HttpGet("current-user")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var dailyInfo = await _apiService.GetDailyInfo();
        if (dailyInfo?.CurrentUser != null)
        {
            return Ok(dailyInfo.CurrentUser);
        }
        return Unauthorized(new { error = "User not logged in" });
    }
}

public class LoginRequest
{
    public LoginParameters Parameters { get; set; } = new();
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string Captcha { get; set; } = "";
}

public class TwoStepRequest
{
    public string Code { get; set; } = "";
    public string Once { get; set; } = "";
}
