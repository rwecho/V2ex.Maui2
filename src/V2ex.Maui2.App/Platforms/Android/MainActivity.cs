using Android.App;
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
}
