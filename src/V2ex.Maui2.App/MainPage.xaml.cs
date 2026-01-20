using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui.Core;
using Microsoft.Maui.Dispatching;
using System.Text.Json;
using V2ex.Maui2.App.Services.Bridge;

namespace V2ex.Maui2.App;

public partial class MainPage : ContentPage
{
    private readonly MauiBridge _bridge;
    private readonly ILogger<MainPage> _logger;

    // If the app was backgrounded longer than this, we assume the OS might have
    // killed the WebView process and proactively reload to avoid a blank screen.
    private static readonly TimeSpan ReloadAfterBackgroundThreshold = TimeSpan.FromSeconds(15);

    // Bindable props for StatusBarBehavior
    public static readonly BindableProperty NativeStatusBarColorProperty =
        BindableProperty.Create(
            nameof(NativeStatusBarColor),
            typeof(Color),
            typeof(MainPage),
            defaultValue: Color.FromArgb("#f3f4f6"));

    public Color NativeStatusBarColor
    {
        get => (Color)GetValue(NativeStatusBarColorProperty);
        set => SetValue(NativeStatusBarColorProperty, value);
    }

    public static readonly BindableProperty NativeStatusBarStyleProperty =
        BindableProperty.Create(
            nameof(NativeStatusBarStyle),
            typeof(StatusBarStyle),
            typeof(MainPage),
            defaultValue: StatusBarStyle.DarkContent);

    public StatusBarStyle NativeStatusBarStyle
    {
        get => (StatusBarStyle)GetValue(NativeStatusBarStyleProperty);
        set => SetValue(NativeStatusBarStyleProperty, value);
    }

    public MainPage(MauiBridge bridge, ILogger<MainPage> logger)
    {
        InitializeComponent();
        _bridge = bridge;
        _logger = logger;

        // Allow XAML behaviors to bind to these properties
        BindingContext = this;

        hybridWebView.SetInvokeJavaScriptTarget(_bridge);

        // When the WebView process is killed while the app is in background (common
        // on iOS/Android under memory pressure), resuming can show a blank WebView.
        // Reloading on resume recovers reliably.
        App.AppResumed += OnAppResumed;
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        App.AppResumed -= OnAppResumed;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // Ensure we are subscribed if the page re-appears.
        App.AppResumed -= OnAppResumed;
        App.AppResumed += OnAppResumed;
    }

    private void OnAppResumed()
    {
        try
        {
            var sleptAt = App.LastSleepTime;
            if (sleptAt.HasValue)
            {
                var elapsed = DateTimeOffset.UtcNow - sleptAt.Value;
                if (elapsed < ReloadAfterBackgroundThreshold)
                {
                    return;
                }
            }

            MainThread.BeginInvokeOnMainThread(async () =>
            {
                try
                {
                    // Give the UI a moment to become active again.
                    await Task.Delay(150);
                    ReloadHybridWebView();
                    _logger.LogInformation("HybridWebView reloaded on app resume.");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to reload HybridWebView on resume.");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Resume handler failed.");
        }
    }

    private void ReloadHybridWebView()
    {
        try
        {
            var platformView = hybridWebView?.Handler?.PlatformView;
            if (platformView is null)
            {
                _logger.LogDebug("HybridWebView platform view not ready; skip reload.");
                return;
            }

#if IOS || MACCATALYST
            if (platformView is WebKit.WKWebView wk)
            {
                wk.Reload();
                return;
            }
#endif

#if ANDROID
            if (platformView is Android.Webkit.WebView awv)
            {
                awv.Reload();
                return;
            }
#endif

            // Best-effort fallback: try a reflection-based Reload() if the platform view
            // is wrapped by another type.
            var mi = platformView.GetType().GetMethod("Reload", Type.EmptyTypes);
            if (mi is not null)
            {
                mi.Invoke(platformView, null);
                return;
            }

            _logger.LogDebug(
                "HybridWebView platform view type {Type} does not support Reload()",
                platformView.GetType().FullName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to reload underlying platform WebView.");
        }
    }

    private void OnHybridWebViewRawMessageReceived(object? sender, HybridWebViewRawMessageReceivedEventArgs e)
    {
        // Optional: useful for debugging if JS calls window.HybridWebView.SendRawMessage(...)
        _logger.LogInformation("HybridWebView raw message: {Message}", e.Message);

        if (string.IsNullOrWhiteSpace(e.Message))
        {
            return;
        }

        // Expect JSON like: {"type":"theme","mode":"dark"|"light"}
        try
        {
            using var doc = JsonDocument.Parse(e.Message);
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var typeProp) || typeProp.GetString() != "theme")
            {
                return;
            }

            var mode = root.TryGetProperty("mode", out var modeProp) ? modeProp.GetString() : null;
            if (mode is not ("dark" or "light"))
            {
                return;
            }

            ApplyNativeTheme(mode);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to parse HybridWebView raw message as theme payload.");
        }
    }

    private void ApplyNativeTheme(string mode)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            if (mode == "dark")
            {
                NativeStatusBarColor = Color.FromArgb("#0b0b0d");
                NativeStatusBarStyle = StatusBarStyle.LightContent;
                BackgroundColor = Color.FromArgb("#0b0b0d");
            }
            else
            {
                NativeStatusBarColor = Color.FromArgb("#f3f4f6");
                NativeStatusBarStyle = StatusBarStyle.DarkContent;
                BackgroundColor = Color.FromArgb("#ffffff");
            }
        });
    }
}

