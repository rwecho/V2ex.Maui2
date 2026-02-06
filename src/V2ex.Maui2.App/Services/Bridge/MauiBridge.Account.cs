using System.Text.Json;
using Microsoft.Extensions.Logging;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    public Task<string> GetLoginParametersAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetLoginParameters());
    }


    public async Task<string> GetCaptchaImageAsync(string once)
    {
        return await ExecuteSafeAsync(async () =>
        {
            var imageData = await apiService.GetCaptchaImage(once);
            var base64Image = Convert.ToBase64String(imageData);

            return new
            {
                success = true,
                image = base64Image,
                mimeType = "image/gif"
            };
        });
    }

    public async Task<string> SignInAsync(string username, string password, string usernameFieldName, string passwordFieldName, string captchaFieldName, string once, string captchaCode)
    {
        return await ExecuteSafeAsync(async () =>
        {
            var result = await apiService.Login(
                 usernameFieldName, passwordFieldName, captchaFieldName, once, username, password, captchaCode);
            return new
            {
                success = true,
                username = username, // assuming success
                message = "登录成功",
                currentUser = result.CurrentUser
            };
        });
    }

    public Task<string> SignOutAsync()
    {
        return ExecuteSafeAsync(() =>
        {
            apiService.SignOut();
            return Task.FromResult(new
            {
                success = true,
                message = "退出成功"
            });
        });
    }

    public async Task<string> IsLoggedInAsync()
    {
        // Custom error handling to return isLoggedIn=false instead of error object
        try
        {
            return await ExecuteSafeAsync(async () =>
            {
                var daily = await apiService.GetDailyInfo();
                return new
                {
                    success = true,
                    isLoggedIn = daily?.CurrentUser != null
                };
            });
        }
        catch
        {
            return JsonSerializer.Serialize(new { success = true, isLoggedIn = false }, _jsonOptions);
        }
    }

    public async Task<string> GetCurrentUserAsync()
    {
        return await ExecuteSafeAsync(async () =>
        {
            var daily = await apiService.GetDailyInfo();
            if (daily?.CurrentUser != null)
            {
                return new { success = true, user = daily.CurrentUser };
            }
            throw new Exception("Not logged in");
        });
    }

    public Task<string> SignInTwoStepAsync(string code, string once)
    {
        return ExecuteSafeAsync(() => apiService.SignInTwoStep(code, once));
    }

    public Task<string> GetDailyInfoAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetDailyInfo());
    }

    public Task<string> CheckInAsync(string once)
    {
        return ExecuteSafeAsync(() => apiService.CheckIn(once));
    }

    public Task<string> GetNotificationsAsync(int page = 1)
    {
        return ExecuteSafeAsync(() => apiService.GetNotifications(page));
    }

    public Task<string> GetFollowingAsync(int page = 1)
    {
        return ExecuteSafeAsync(() => apiService.GetFollowingInfo(page));
    }

    public Task<string> GetFavoriteTopicsAsync(int page = 1)
    {
        return ExecuteSafeAsync(() => apiService.GetFavoriteTopics(page));
    }

    public Task<string> GetFavoriteNodesAsync()
    {
        return ExecuteSafeAsync(() => apiService.GetFavoriteNodes());
    }
}
