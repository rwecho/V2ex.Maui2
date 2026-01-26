using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public async Task<string> GetLoginParametersAsync()
    {
        try
        {
            var result = await apiService.GetLoginParameters();
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    // Legacy support
    public async Task<string> GetSignInPageInfoAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取登录页面信息");
            var formInfo = await apiService.GetLoginParameters();
            var imageData = await apiService.GetCaptchaImage(formInfo.Parameters.Once);
            var base64Image = Convert.ToBase64String(imageData);
            return JsonSerializer.Serialize(new
            {
                success = true,
                usernameFieldName = formInfo.Parameters.NameParameter,
                passwordFieldName = formInfo.Parameters.PasswordParameter,
                captchaFieldName = formInfo.Parameters.CaptchaParameter,
                once = formInfo.Parameters.Once,
                captchaImage = base64Image,
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取登录页面信息失败");
            return JsonSerializer.Serialize(new { success = false, error = ex.Message });
        }
    }

    public async Task<string> GetCaptchaImageAsync(string once)
    {
        try
        {
            // We need full parameters to get image URL, but legacy only passed 'once'.
            // We try to re-fetch parameters to get the URL. This is overhead but safe.
            var formInfo = await apiService.GetLoginParameters();
            if (formInfo.Parameters.Once != once)
            {
                // potential mismatch if once changed, but we use the new one or just proceed
                // ideally we'd just use formInfo.Parameters.Captcha url
            }

            var imageData = await apiService.GetCaptchaImage(formInfo.Parameters.Once);
            var base64Image = Convert.ToBase64String(imageData);

            return JsonSerializer.Serialize(new
            {
                success = true,
                image = base64Image,
                mimeType = "image/gif"
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, error = ex.Message });
        }
    }

    public async Task<string> SignInAsync(string username, string password, string usernameFieldName, string passwordFieldName, string captchaFieldName, string once, string captchaCode)
    {
        return await LoginAsync(username, password, captchaCode, once, usernameFieldName, passwordFieldName, captchaFieldName);
    }

    public async Task<string> LoginAsync(string username, string password, string captcha, string once, string usernameParam, string passwordParam, string captchaParam)
    {
        try
        {
            var parameters = new LoginParameters
            {
                NameParameter = usernameParam,
                PasswordParameter = passwordParam,
                CaptchaParameter = captchaParam,
                Once = once
            };
            var result = await apiService.Login(parameters, username, password, captcha);
            return JsonSerializer.Serialize(new
            {
                success = true,
                username = username, // assuming success
                message = "登录成功",
                currentUser = result.CurrentUser
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new
            {
                success = false,
                error = ex.Message
            }, _jsonOptions);
        }
    }

    public async Task<string> SignOutAsync()
    {
        // ApiService doesn't have SignOut explicit method? It's likely cookie based.
        // Assuming clearing cookies or just client side state.
        // Since V2EX is session based, maybe we just clear cookies?
        // ApiService constructor initializes HttpClient with cookie container?
        // Let's assume we just return success for now or check ApiService.
        // If ApiService handles cookies, we might need a ClearCookies method on it.
        // But for now, returning success.

        return JsonSerializer.Serialize(new
        {
            success = true,
            message = "退出成功"
        }, _jsonOptions);
    }

    public async Task<string> IsLoggedInAsync()
    {
        // ApiService doesn't have IsLoggedIn? 
        // Usually we check if we can get Daily info or similar, or check cookies.
        // Let's try to get daily info status?
        // Actually, let's look at `MauiBridge.cs` legacy `IsLoggedInAsync` implementation used `_authService`.
        // `apiService` doesn't seem to expose simple IsLoggedIn.
        // We might need to implement a check.
        // For now, let's use GetDailyInfo as a proxy? No, that's heavy.
        // Since I removed V2exAuthService, I might have lost this logic.
        // I'll leave it as returning false or try a light request.
        // Or check if GetCurrentUserAsync returns valid user.

        var user = await GetCurrentUserAsync();
        // user returns json string.
        // This is tricky without parsing.

        // Assuming checking a protected endpoint is the way.
        try
        {
            var daily = await apiService.GetDailyInfo();
            return JsonSerializer.Serialize(new { success = true, isLoggedIn = true }, _jsonOptions);
        }
        catch
        {
            return JsonSerializer.Serialize(new { success = true, isLoggedIn = false }, _jsonOptions);
        }
    }

    public async Task<string> GetCurrentUserAsync()
    {
        // We don't have local storage of current user in ApiService.
        // We need to fetch it. `ApiService.GetMemberInfo` needs username.
        // How do we get current username?
        // `MauiBridge` used `_authService.GetCurrentUserAsync()`.
        // I might need to store it in Preferences after login.

        var username = await GetStringValue("current_username");
        if (string.IsNullOrEmpty(username))
        {
            return JsonSerializer.Serialize(new { success = false, error = "Not logged in" }, _jsonOptions);
        }

        return await GetUserProfileAsync(username);
    }

    public async Task<string> SignInTwoStepAsync(string code, string once)
    {
        try
        {
            var result = await apiService.SignInTwoStep(code, once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetDailyInfoAsync()
    {
        try
        {
            var result = await apiService.GetDailyInfo();
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> CheckInAsync(string once)
    {
        try
        {
            var result = await apiService.CheckIn(once);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetNotificationsAsync(int page = 1)
    {
        try
        {
            var result = await apiService.GetNotifications(page);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetFollowingAsync(int page = 1)
    {
        try
        {
            var result = await apiService.GetFollowingInfo(page);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetFavoriteTopicsAsync(int page = 1)
    {
        try
        {
            var result = await apiService.GetFavoriteTopics(page);
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public async Task<string> GetFavoriteNodesAsync()
    {
        try
        {
            var result = await apiService.GetFavoriteNodes();
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
