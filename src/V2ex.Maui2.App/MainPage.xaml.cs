using Microsoft.Extensions.Logging;
using V2ex.Maui2.App.Services.Bridge;

namespace V2ex.Maui2.App;

public partial class MainPage : ContentPage
{
    private readonly MauiBridge _bridge;
    private readonly ILogger<MainPage> _logger;

    public MainPage(MauiBridge bridge, ILogger<MainPage> logger)
    {
        InitializeComponent();
        _bridge = bridge;
        _logger = logger;

        hybridWebView.SetInvokeJavaScriptTarget(_bridge);
    }

    private void OnHybridWebViewRawMessageReceived(object? sender, HybridWebViewRawMessageReceivedEventArgs e)
    {
        // Optional: useful for debugging if JS calls window.HybridWebView.SendRawMessage(...)
        _logger.LogInformation("HybridWebView raw message: {Message}", e.Message);
    }
}

