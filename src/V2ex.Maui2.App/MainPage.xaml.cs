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

