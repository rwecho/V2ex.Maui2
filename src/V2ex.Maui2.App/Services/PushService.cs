using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Plugin.Firebase.CloudMessaging;
using V2ex.Maui2.Core.Services;

namespace V2ex.Maui2.App.Services
{
    public class PushService : IPushService
    {
        private readonly ILogger<PushService> _logger;
        // Check this URL, it should be your Cloudflare Worker URL
        // User should provide or we use placeholder?
        // Using local dev URL or placeholder for now.
        // Assuming we need a way to config this. 
        // For now hardcode placeholder, user can update.
        private const string CLOUDFLARE_WORKER_URL = "https://v2ex-push-service.rwecho.workers.dev"; 

        public PushService(ILogger<PushService> logger)
        {
            _logger = logger;
        }

        public async Task Register(string feedUrl)
        {
            try
            {
                await CrossFirebaseCloudMessaging.Current.CheckIfValidAsync();
                var token = await CrossFirebaseCloudMessaging.Current.GetTokenAsync();

                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("FCM Token is empty.");
                    return;
                }

                var lastToken = Preferences.Get("push_last_token", string.Empty);
                var lastFeedUrl = Preferences.Get("push_last_feed_url", string.Empty);

                if (token == lastToken && feedUrl == lastFeedUrl)
                {
                    _logger.LogDebug("Push registration skipped: No changes in Token or Feed URL.");
                    return;
                }

                _logger.LogInformation($"FCM Token: {token}");
                _logger.LogInformation($"Feed URL: {feedUrl}");

                var payload = new
                {
                    feedUrl = feedUrl,
                    fcmToken = token,
                    deviceType = DeviceInfo.Platform.ToString()
                };

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                using var client = new HttpClient();
                var response = await client.PostAsync($"{CLOUDFLARE_WORKER_URL}/register", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Successfully registered push notification.");
                    Preferences.Set("push_last_token", token);
                    Preferences.Set("push_last_feed_url", feedUrl);
                }
                else
                {
                    _logger.LogError($"Failed to register push. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error initializing push service. Message: {ex.Message}, Inner: {ex.InnerException?.Message}");
            }
        }
    }
}
