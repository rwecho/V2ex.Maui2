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


    public async Task<string> GetCaptchaImageAsync(string once)
    {
        try
        {
            // We need full parameters to get image URL, but legacy only passed 'once'.
            // We try to re-fetch parameters to get the URL. This is overhead but safe.
            var formInfo = await apiService.GetLoginParameters();
            if (formInfo.Once != once)
            {
                // potential mismatch if once changed, but we use the new one or just proceed
                // ideally we'd just use formInfo.Parameters.Captcha url
            }

            var imageData = await apiService.GetCaptchaImage(formInfo.Once);
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
        try
        {
            var result = await apiService.Login(
                 usernameFieldName, passwordFieldName, captchaFieldName, once, username, password, captchaCode);
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
        try
        {
            apiService.SignOut();
            return JsonSerializer.Serialize(new
            {
                success = true,
                message = "退出成功"
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, error = ex.Message });
        }
    }

    public async Task<string> IsLoggedInAsync()
    {
        try
        {
            var daily = await apiService.GetDailyInfo();
            return JsonSerializer.Serialize(new
            {
                success = true,
                isLoggedIn = daily?.CurrentUser != null
            }, _jsonOptions);
        }
        catch
        {
            return JsonSerializer.Serialize(new { success = true, isLoggedIn = false }, _jsonOptions);
        }
    }

    public async Task<string> GetCurrentUserAsync()
    {
        try
        {
            var daily = await apiService.GetDailyInfo();
            if (daily?.CurrentUser != null)
            {
                return JsonSerializer.Serialize(new { success = true, user = daily.CurrentUser }, _jsonOptions);
            }
            return JsonSerializer.Serialize(new { success = false, error = "Not logged in" }, _jsonOptions);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, error = ex.Message }, _jsonOptions);
        }
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
