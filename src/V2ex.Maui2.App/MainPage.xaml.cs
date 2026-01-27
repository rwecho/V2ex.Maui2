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
    
    // Splash Screen 超时定时器
    private CancellationTokenSource? _splashTimeoutCts;

    // Bindable props for StatusBarBehavior
    public static readonly BindableProperty NativeStatusBarColorProperty =
        BindableProperty.Create(
            nameof(NativeStatusBarColor),
            typeof(Color),
            typeof(MainPage),
            defaultValue: Color.FromArgb("#121212")); // 默认深色背景匹配 Splash Screen

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
            defaultValue: StatusBarStyle.LightContent); // 默认浅色文字匹配 Splash Screen

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

        // App 恢复时检查 WebView 状态
        App.AppResumed += OnAppResumed;

        // 显示初始 Splash Screen 并启动超时定时器
        ShowSplashScreenWithTimeout("正在加载...", TimeSpan.FromSeconds(5));
    }

    /// <summary>
    /// 显示 Splash Screen 并启动超时定时器
    /// 如果在指定时间内没有收到 appReady 消息，将强制隐藏 Splash Screen
    /// </summary>
    private void ShowSplashScreenWithTimeout(string message, TimeSpan timeout)
    {
        ShowSplashScreen(message);
        
        // 取消之前的超时定时器
        _splashTimeoutCts?.Cancel();
        _splashTimeoutCts = new CancellationTokenSource();
        var token = _splashTimeoutCts.Token;
        
        // 启动超时定时器
        Task.Run(async () =>
        {
            try
            {
                await Task.Delay(timeout, token);
                
                // 超时了，强制隐藏 Splash Screen
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    if (IsLoading)
                    {
                        _logger.LogWarning("Splash screen timeout, forcing hide.");
                        HideSplashScreen();
                    }
                });
            }
            catch (TaskCanceledException)
            {
                // 定时器被取消，说明 appReady 已收到
            }
        }, token);
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
                    await HandleResumeAsync();
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

    /// <summary>
    /// 统一的 App 恢复处理逻辑（Android/iOS 通用）
    /// 1. 检测 WebView 是否处于正常状态
    /// 2. 如果 WebView 无响应或页面空白，则执行恢复
    /// </summary>
    private async Task HandleResumeAsync()
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

            // 平台特定的有效性检查
            if (!IsWebViewAttached(platformView))
            {
                _logger.LogWarning("WebView not attached on resume.");
                return;
            }

            // 通过 JavaScript 检测 WebView 是否健康
            var isHealthy = await CheckWebViewHealthAsync();
            
            if (isHealthy)
            {
                _logger.LogInformation("WebView is healthy after resume, no reload needed.");
                return;
            }

            // WebView 需要恢复
            _logger.LogInformation("WebView needs recovery, starting reload...");
            
            // 显示恢复中的 Splash Screen 并启动超时定时器
            ShowSplashScreenWithTimeout("正在恢复...", TimeSpan.FromSeconds(5));

            // 执行恢复（会触发 appReady 消息来隐藏 Splash Screen）
            await RecoverWebViewAsync();
            
            _logger.LogInformation("WebView recovery initiated.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle resume.");
            HideSplashScreen();
        }
    }

    /// <summary>
    /// 检查 WebView 是否已附加到窗口（平台特定）
    /// </summary>
    private bool IsWebViewAttached(object platformView)
    {
#if ANDROID
        if (platformView is Android.Webkit.WebView awv)
        {
            return awv.Handler != null && awv.IsAttachedToWindow;
        }
#endif
#if IOS || MACCATALYST
        if (platformView is WebKit.WKWebView wk)
        {
            return wk.Window != null;
        }
#endif
        return true; // 默认假设已附加
    }

    /// <summary>
    /// 通过 JavaScript 检测 WebView 是否处于健康状态（跨平台）
    /// </summary>
    private async Task<bool> CheckWebViewHealthAsync()
    {
        try
        {
            var healthCheckScript = @"
                (function() {
                    try {
                        if (!document || !document.body) return 'NO_BODY';
                        if (document.body.innerHTML.length < 100) return 'EMPTY_PAGE';
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
    /// 恢复 WebView（跨平台统一实现）
    /// </summary>
    private async Task RecoverWebViewAsync()
    {
        var platformView = hybridWebView?.Handler?.PlatformView;
        
        // 方案 1: 尝试通过 JavaScript 刷新页面（跨平台）
        try
        {
            await hybridWebView.EvaluateJavaScriptAsync("window.location.reload(false);");
            _logger.LogInformation("WebView reloaded via JavaScript.");
            return;
        }
        catch (Exception jsEx)
        {
            _logger.LogWarning(jsEx, "JavaScript reload failed, trying native reload.");
        }

        // 方案 2: 平台特定的原生 Reload
#if ANDROID
        if (platformView is Android.Webkit.WebView awv)
        {
            try
            {
                awv.StopLoading();
                await Task.Delay(50);
                awv.Reload();
                _logger.LogInformation("WebView reloaded via Android native Reload().");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Android native Reload() failed.");
            }
        }
#endif

#if IOS || MACCATALYST
        if (platformView is WebKit.WKWebView wk)
        {
            try
            {
                wk.Reload();
                _logger.LogInformation("WebView reloaded via iOS native Reload().");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "iOS native Reload() failed.");
            }
        }
#endif

        // 方案 3: 反射方式尝试调用 Reload
        try
        {
            var mi = platformView?.GetType().GetMethod("Reload", Type.EmptyTypes);
            if (mi != null)
            {
                mi.Invoke(platformView, null);
                _logger.LogInformation("WebView reloaded via reflection.");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "All WebView recovery methods failed.");
        }
    }

    private void OnHybridWebViewRawMessageReceived(object? sender, HybridWebViewRawMessageReceivedEventArgs e)
    {
        _logger.LogInformation("HybridWebView raw message: {Message}", e.Message);

        if (string.IsNullOrWhiteSpace(e.Message))
        {
            return;
        }

        try
        {
            using var doc = JsonDocument.Parse(e.Message);
            var root = doc.RootElement;
            
            if (!root.TryGetProperty("type", out var typeProp))
            {
                return;
            }
            
            var messageType = typeProp.GetString();
            
            switch (messageType)
            {
                case "appReady":
                    HandleAppReady();
                    break;
                    
                case "theme":
                    var mode = root.TryGetProperty("mode", out var modeProp) ? modeProp.GetString() : null;
                    if (mode is "dark" or "light")
                    {
                        ApplyNativeTheme(mode);
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to parse HybridWebView raw message.");
        }
    }

    /// <summary>
    /// 处理前端发送的 appReady 消息
    /// </summary>
    private void HandleAppReady()
    {
        _logger.LogInformation("Received appReady message from frontend.");
        
        // 取消超时定时器
        _splashTimeoutCts?.Cancel();
        _splashTimeoutCts = null;
        
        // 隐藏 Splash Screen
        MainThread.BeginInvokeOnMainThread(() =>
        {
            HideSplashScreen();
        });
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

