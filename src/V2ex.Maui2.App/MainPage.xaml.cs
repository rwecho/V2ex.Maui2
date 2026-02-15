using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui.Core;
using Microsoft.Maui.Dispatching;
using System.Text.Json;
using V2ex.Maui2.App.Services.Bridge;
using HtmlAgilityPack;
using System.Text.Json.Serialization;
using System.Text;

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

        // 设置初始状态栏颜色以匹配主题
        if (Application.Current?.RequestedTheme == AppTheme.Light)
        {
            NativeStatusBarColor = Color.FromArgb("#f3f4f6");
            NativeStatusBarStyle = StatusBarStyle.DarkContent;
            BackgroundColor = Color.FromArgb("#ffffff");
        }
        else
        {
            NativeStatusBarColor = Color.FromArgb("#0b0b0d");
            NativeStatusBarStyle = StatusBarStyle.LightContent;
            BackgroundColor = Color.FromArgb("#0b0b0d");
        }

        // 监听主题变化
        if (Application.Current != null)
        {
            Application.Current.RequestedThemeChanged += (s, e) =>
            {
                ApplyNativeTheme(e.RequestedTheme == AppTheme.Dark ? "dark" : "light");
            };
        }

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
            await splashScreen.FadeToAsync(0, 250, Easing.Linear);

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
            _logger.LogInformation("App resumed. Starting delayed recovery sequence...");

            // 关键修复：不要立即 InvokeMainThread。
            // 在后台线程等待一小会儿 (300ms)，给原生 View 重新 Attach 到 Window 的时间。
            Task.Run(async () =>
            {
                await Task.Delay(300);

                MainThread.BeginInvokeOnMainThread(async () =>
                {
                    try
                    {
                        // 再次检查页面是否还存在（防止用户快速关闭页面）
                        if (this.Handler == null || hybridWebView.Handler == null)
                        {
                            _logger.LogWarning("Page or WebView is gone after resume delay.");
                            return;
                        }

                        await HandleResumeAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to handle WebView resume.");
                        // 确保 Splash Screen 被隐藏
                        HideSplashScreen();
                    }
                });
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resume handler failed to start.");
        }
    }

    /// <summary>
    /// 统一的 App 恢复处理逻辑（Android/iOS 通用）
    /// 1. 先显示 Splash Screen 保护用户体验
    /// 2. 严格检查 WebView 状态
    /// 3. 如果 WebView 无响应或页面空白，则执行恢复
    /// </summary>
    private async Task HandleResumeAsync()
    {
        try
        {
            // 1. 再次显示 Splash，防止闪烁
            ShowSplashScreenWithTimeout("正在恢复...", TimeSpan.FromSeconds(8));

            // 2. 极其严格的空值检查
            if (hybridWebView == null)
            {
                _logger.LogWarning("HybridWebView is null.");
                HideSplashScreen();
                return;
            }

            // 检查 MAUI 控件本身是否被卸载
            if (hybridWebView.Handler == null || hybridWebView.Handler.PlatformView == null)
            {
                _logger.LogWarning("HybridWebView Handler or PlatformView is null. Cannot resume.");
                HideSplashScreen();
                return;
            }

            var platformView = hybridWebView.Handler.PlatformView;

            // 3. 检查原生 View 是否真正 Attach (这是崩溃最常见的原因)
            if (!IsWebViewAttached(platformView))
            {
                _logger.LogWarning("WebView is not attached to window yet. Aborting JS check to prevent crash.");
                HideSplashScreen();
                return;
            }

            // 4. (Android 特有) 检查 Context 是否有效
#if ANDROID
            if (platformView is Android.Webkit.WebView androidWebView)
            {
                if (androidWebView.Context == null)
                {
                    _logger.LogWarning("Android WebView Context is null.");
                    HideSplashScreen();
                    return;
                }
            }
#endif

            _logger.LogInformation("WebView seems attached. Checking health...");

            // 5. 执行健康检查
            bool isHealthy = false;
            try
            {
                // 给 JS 执行引擎一点点喘息时间，防止 IPC 通道未就绪
                await Task.Delay(100);
                isHealthy = await CheckWebViewHealthAsync();
            }
            catch (Exception ex)
            {
                // 这里的 catch 非常重要，JS 执行失败不应导致 App 闪退
                _logger.LogWarning(ex, "Health check crashed/failed.");
                isHealthy = false;
            }

            if (isHealthy)
            {
                _logger.LogInformation("WebView is healthy.");
                HideSplashScreen();
            }
            else
            {
                _logger.LogInformation("WebView needs recovery. Reloading...");
                await RecoverWebViewAsync();
            }
        }
        catch (Exception ex)
        {
            // 捕获所有未预料的异常，确保不 crash
            _logger.LogError(ex, "Fatal error in HandleResumeAsync.");
            HideSplashScreen();
        }
    }

    /// <summary>
    /// 检查 WebView 是否已附加到窗口（平台特定）
    /// </summary>
    private bool IsWebViewAttached(object platformView)
    {
        try
        {
#if ANDROID
            if (platformView is Android.Webkit.WebView awv)
            {
                // 增加 awv.Context 检查，防止 ObjectDisposedException
                return awv.Handle != IntPtr.Zero &&
                       awv.Context != null &&
                       awv.IsAttachedToWindow &&
                       awv.WindowVisibility == Android.Views.ViewStates.Visible;
            }
#endif
#if IOS || MACCATALYST
            if (platformView is WebKit.WKWebView wk)
            {
                return wk.Window != null && wk.Superview != null;
            }
#endif
            return true; // 默认假设已附加
        }
        catch
        {
            // 任何访问原生属性的异常都视为未 Attach
            return false;
        }
    }

    private async void OnButtonClicked(object sender, EventArgs e)
    {
        await CheckWebViewHealthAsync();
    }

    /// <summary>
    /// 通过 JavaScript 检测 WebView 是否处于健康状态（跨平台）
    /// </summary>
    private async Task<bool> CheckWebViewHealthAsync()
    {
        try
        {
            var result = await hybridWebView.InvokeJavaScriptAsync(
                "checkWebViewHealth",
                HybridJSContext.Default.String);
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
                case "appInit":
                    HandleAppInit();
                    break;

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

    private async void OnHybridWebViewLoaded(object sender, EventArgs e)
    {
        _logger.LogInformation("HybridWebView loaded event fired.");
    }

    /// <summary>
    /// 处理前端发送的 appInit 消息，通常包含平台信息等初始化数据
    /// 在收到 appInit 后，前端会等待 initData 消息来完成初始化
    /// </summary>
    private void HandleAppInit()
    {
        _logger.LogInformation("Received appInit message from frontend.");
        MainThread.BeginInvokeOnMainThread(() =>
       {
           try
           {
               var initData = new
               {
                   type = "initData",
                   payload = new
                   {
                       platform = DeviceInfo.Platform == DevicePlatform.Android ? "android" : "ios"
                   }
               };
               hybridWebView.SendRawMessage(JsonSerializer.Serialize(initData));
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Failed to send initData");
           }
       });
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
                splashScreen.BackgroundColor = Color.FromArgb("#0b0b0d");

#if ANDROID
                if (Platform.CurrentActivity?.Window != null)
                {
                    Platform.CurrentActivity.Window.SetNavigationBarColor(Android.Graphics.Color.ParseColor("#0b0b0d"));

                    // API 27+ only. Dark background -> Light items
                    if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.O)
                    {
                        var controller = AndroidX.Core.View.WindowCompat.GetInsetsController(Platform.CurrentActivity.Window, Platform.CurrentActivity.Window.DecorView);
                        if (controller != null)
                        {
                            controller.AppearanceLightNavigationBars = false;
                        }
                    }
                }
#endif
            }
            else
            {
                NativeStatusBarColor = Color.FromArgb("#f3f4f6");
                NativeStatusBarStyle = StatusBarStyle.DarkContent;
                BackgroundColor = Color.FromArgb("#ffffff");
                splashScreen.BackgroundColor = Color.FromArgb("#ffffff");

#if ANDROID
                if (Platform.CurrentActivity?.Window != null)
                {
                    Platform.CurrentActivity.Window.SetNavigationBarColor(Android.Graphics.Color.ParseColor("#ffffff"));

                    // Light background -> Dark items
                    if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.O)
                    {
                        var controller = AndroidX.Core.View.WindowCompat.GetInsetsController(Platform.CurrentActivity.Window, Platform.CurrentActivity.Window.DecorView);
                         if (controller != null)
                        {
                            controller.AppearanceLightNavigationBars = true;
                        }
                    }
                }
#endif
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

[JsonSourceGenerationOptions(WriteIndented = true)]
[JsonSerializable(typeof(double))]
[JsonSerializable(typeof(string))]
[JsonSerializable(typeof(Dictionary<string, string>))]
internal partial class HybridJSContext : JsonSerializerContext
{

}

