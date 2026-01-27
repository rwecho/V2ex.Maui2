using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui.Core;
using Microsoft.Maui.Dispatching;
using System.Text.Json;
using V2ex.Maui2.App.Services.Bridge;
using HtmlAgilityPack;

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

    // Splash Screen Bindable Properties
    public static readonly BindableProperty IsLoadingProperty =
        BindableProperty.Create(
            nameof(IsLoading),
            typeof(bool),
            typeof(MainPage),
            defaultValue: true);

    public bool IsLoading
    {
        get => (bool)GetValue(IsLoadingProperty);
        set => SetValue(IsLoadingProperty, value);
    }

    public static readonly BindableProperty LoadingTextProperty =
        BindableProperty.Create(
            nameof(LoadingText),
            typeof(string),
            typeof(MainPage),
            defaultValue: "正在加载...");

    public string LoadingText
    {
        get => (string)GetValue(LoadingTextProperty);
        set => SetValue(LoadingTextProperty, value);
    }

    public MainPage(MauiBridge bridge, ILogger<MainPage> logger)
    {
        InitializeComponent();
        _bridge = bridge;
        _logger = logger;

        // Allow XAML behaviors to bind to these properties
        BindingContext = this;

        hybridWebView.SetInvokeJavaScriptTarget(_bridge);

        // 监听 WebView 导航完成事件，用于隐藏 Splash Screen
        hybridWebView.Navigated += OnWebViewNavigated;

        // When the WebView process is killed while the app is in background (common
        // on iOS/Android under memory pressure), resuming can show a blank WebView.
        // Reloading on resume recovers reliably.
        App.AppResumed += OnAppResumed;

        // 显示初始 Splash Screen
        ShowSplashScreen("正在加载...");
    }

    private void OnWebViewNavigated(object sender, WebNavigatedEventArgs e)
    {
        // WebView 导航完成，延迟一点再隐藏 Splash Screen
        _logger.LogInformation("WebView navigated to: {Url}", e.Url);

        MainThread.BeginInvokeOnMainThread(async () =>
        {
            // 等待 JavaScript 执行和渲染完成
            await Task.Delay(800);
            HideSplashScreen();
        });
    }

    private void ShowSplashScreen(string message = "正在加载...")
    {
        IsLoading = true;
        LoadingText = message;
        splashScreen.IsVisible = true;
        splashScreen.Opacity = 1;
        _logger.LogInformation("Splash screen shown: {Message}", message);
    }

    private async void HideSplashScreen()
    {
        try
        {
            _logger.LogInformation("Hiding splash screen...");

            // 淡出动画
            await splashScreen.FadeTo(0, 250, Easing.Linear);

            splashScreen.IsVisible = false;
            IsLoading = false;

            _logger.LogInformation("Splash screen hidden");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to hide splash screen with animation");
            // 降级方案：直接隐藏
            splashScreen.IsVisible = false;
            IsLoading = false;
        }
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        App.AppResumed -= OnAppResumed;

    }

    protected override async void OnAppearing()
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
            _logger.LogInformation("App resumed, checking WebView state...");

            // 在主线程上执行恢复逻辑
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                try
                {
                    // 检查 WebView 是否可用
                    var platformView = hybridWebView?.Handler?.PlatformView;
                    if (platformView == null)
                    {
                        _logger.LogWarning("HybridWebView platform view not ready on resume.");
                        return;
                    }

#if ANDROID
                    // Android 特殊处理：休眠后 WebView 可能处于损坏状态
                    // 需要检测并恢复 WebView
                    if (platformView is Android.Webkit.WebView awv)
                    {
                        await HandleAndroidResumeAsync(awv);
                    }
#endif
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to handle WebView resume.");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resume handler failed.");
        }
    }

#if ANDROID
    /// <summary>
    /// Android 休眠恢复处理：
    /// 1. 先检测 WebView 是否处于正常状态
    /// 2. 如果 WebView 无响应或页面空白，则执行恢复
    /// </summary>
    private async Task HandleAndroidResumeAsync(Android.Webkit.WebView awv)
    {
        try
        {
            // 检查 WebView 是否仍然有效
            if (awv.Handler == null || !awv.IsAttachedToWindow)
            {
                _logger.LogWarning("WebView not attached to window on resume.");
                return;
            }

            // 检测 WebView 是否处于正常状态
            var isHealthy = await CheckWebViewHealthAsync(awv);
            
            if (isHealthy)
            {
                _logger.LogInformation("WebView is healthy after resume, no reload needed.");
                return;
            }

            // WebView 需要恢复
            _logger.LogInformation("WebView needs recovery, starting reload...");
            
            // 显示恢复中的 Splash Screen
            ShowSplashScreen("正在恢复...");

            // 执行恢复
            await RecoverAndroidWebViewAsync(awv);

            // 等待加载完成后隐藏 Splash Screen
            await Task.Delay(500);
            HideSplashScreen();
            
            _logger.LogInformation("WebView recovered successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle Android resume.");
            HideSplashScreen();
        }
    }

    /// <summary>
    /// 检测 WebView 是否处于健康状态
    /// </summary>
    private async Task<bool> CheckWebViewHealthAsync(Android.Webkit.WebView awv)
    {
        try
        {
            // 检查是否有有效的 URL
            var currentUrl = awv.Url;
            if (string.IsNullOrEmpty(currentUrl))
            {
                _logger.LogWarning("WebView URL is empty.");
                return false;
            }

            // 通过 JavaScript 验证页面是否可响应
            var healthCheckScript = @"
                (function() {
                    try {
                        // 检查 document 是否存在且可访问
                        if (!document || !document.body) return 'NO_BODY';
                        
                        // 检查页面是否有内容
                        if (document.body.innerHTML.length < 100) return 'EMPTY_PAGE';
                        
                        // 检查 React/Ionic app 是否已挂载
                        var appRoot = document.getElementById('root') || document.getElementById('app');
                        if (appRoot && appRoot.children.length > 0) {
                            return 'HEALTHY';
                        }
                        
                        return 'UNKNOWN';
                    } catch (e) {
                        return 'ERROR:' + e.message;
                    }
                })()
            ";

            var result = await hybridWebView.EvaluateJavaScriptAsync(healthCheckScript);
            _logger.LogInformation("WebView health check result: {Result}", result);

            return result == "\"HEALTHY\"" || result == "HEALTHY";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "WebView health check failed, assuming unhealthy.");
            return false;
        }
    }

    /// <summary>
    /// 恢复 Android WebView
    /// </summary>
    private async Task RecoverAndroidWebViewAsync(Android.Webkit.WebView awv)
    {
        // 方案 1: 尝试通过 JavaScript 刷新页面
        try
        {
            var reloadScript = "window.location.reload(false);";
            await hybridWebView.EvaluateJavaScriptAsync(reloadScript);
            _logger.LogInformation("WebView reloaded via JavaScript.");
            return;
        }
        catch (Exception jsEx)
        {
            _logger.LogWarning(jsEx, "JavaScript reload failed, trying native reload.");
        }

        // 方案 2: 使用原生 Reload
        try
        {
            awv.StopLoading();
            await Task.Delay(50);
            awv.Reload();
            _logger.LogInformation("WebView reloaded via native Reload().");
            return;
        }
        catch (Exception reloadEx)
        {
            _logger.LogWarning(reloadEx, "Native Reload() failed, trying LoadUrl.");
        }

        // 方案 3: 重新加载当前 URL
        try
        {
            var currentUrl = awv.Url;
            if (!string.IsNullOrEmpty(currentUrl))
            {
                awv.LoadUrl(currentUrl);
                _logger.LogInformation("WebView reloaded via LoadUrl().");
            }
        }
        catch (Exception urlEx)
        {
            _logger.LogError(urlEx, "All WebView recovery methods failed.");
        }
    }
#endif

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
            // Android 的处理已经移到 ReloadAndroidWebViewAsync
            if (platformView is Android.Webkit.WebView)
            {
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

#if ANDROID
    protected override bool OnBackButtonPressed()
    {
        // 拦截 Android 返回键，优先让 Ionic Router 处理
        try
        {
            // 调用 JavaScript 检查并执行返回
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                try
                {
                    // 1. 仅在 Android 平台下执行此逻辑
#if ANDROID
                    // 2. 获取 HybridWebView 的 Handler，并尝试转换为 Android 原生的 WebView
                    // 注意：这里的 HybridWebViewControl 是你 xaml 中控件的 x:Name
                    var androidWebView = hybridWebView.Handler?.PlatformView as Android.Webkit.WebView;

                    // 3. 检查原生 WebView 是否可以回退
                    if (androidWebView != null && androidWebView.CanGoBack())
                    {
                        androidWebView.GoBack();
                    }
#endif
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to handle back button in WebView");
                    // 发生错误时，允许默认行为（退出应用）
                    base.OnBackButtonPressed();
                }
            });

            // 返回 true 表示我们已经处理了返回键
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnBackButtonPressed");
            return base.OnBackButtonPressed();
        }
    }
#endif

}

