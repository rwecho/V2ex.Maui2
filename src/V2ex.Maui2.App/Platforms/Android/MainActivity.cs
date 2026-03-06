using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;
using Plugin.Firebase.Core.Platforms.Android;

namespace V2ex.Maui2.App;

[Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true, LaunchMode = LaunchMode.SingleTop, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density, WindowSoftInputMode = Android.Views.SoftInput.AdjustResize)]
public class MainActivity : MauiAppCompatActivity
{
    protected override void OnCreate(Bundle savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        CapturePushIntent(Intent);

        // Android 15 (API 35) Edge-to-Edge
        // Only enable for Android 15+ as requested
        if (Build.VERSION.SdkInt >= (BuildVersionCodes)35 && Window != null)
        {
            AndroidX.Core.View.WindowCompat.SetDecorFitsSystemWindows(Window, false);
        }

        // 初始化 Firebase
        try
        {
            CrossFirebase.Initialize(this, () => this);
        }
        catch (Exception ex)
        {
            // ignore - don't crash startup if Firebase isn't configured
            System.Diagnostics.Trace.WriteLine($"Firebase initialization error: {ex}");
        }
    }

    protected override void OnNewIntent(Intent? intent)
    {
        base.OnNewIntent(intent);
        CapturePushIntent(intent);
    }

    private static void CapturePushIntent(Intent? intent)
    {
        try
        {
            if (intent?.Extras == null)
            {
                return;
            }

            var extras = intent.Extras;
            var link = extras?.GetString("link")
                ?? extras?.GetString("gcm.notification.link")
                ?? extras?.GetString("google.c.a.link");

            var topicId = extras?.GetString("topicId")
                ?? extras?.GetString("gcm.notification.topicId");

            if (string.IsNullOrWhiteSpace(topicId) && !string.IsNullOrWhiteSpace(link))
            {
                var match = System.Text.RegularExpressions.Regex.Match(link, @"/t/(\d+)");
                if (match.Success)
                {
                    topicId = match.Groups[1].Value;
                }
            }

            if (string.IsNullOrWhiteSpace(topicId))
            {
                return;
            }

            Preferences.Set("push_pending_topic_id", topicId);
            Preferences.Set("push_pending_link", link ?? string.Empty);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Trace.WriteLine($"CapturePushIntent failed: {ex}");
        }
    }
}
