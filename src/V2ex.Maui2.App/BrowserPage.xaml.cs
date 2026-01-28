using CommunityToolkit.Maui.Core;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.PlatformConfiguration;

namespace V2ex.Maui2.App;

public partial class BrowserPage : ContentPage
{
    private readonly string _url;

    public static readonly BindableProperty StatusBarColorProperty =
        BindableProperty.Create(
            nameof(StatusBarColor),
            typeof(Color),
            typeof(BrowserPage),
            defaultValue: Color.FromArgb("#f3f4f6"));

    public Color StatusBarColor
    {
        get => (Color)GetValue(StatusBarColorProperty);
        set => SetValue(StatusBarColorProperty, value);
    }

    public static readonly BindableProperty StatusBarStyleProperty =
        BindableProperty.Create(
            nameof(StatusBarStyle),
            typeof(StatusBarStyle),
            typeof(BrowserPage),
            defaultValue: StatusBarStyle.DarkContent);

    public StatusBarStyle StatusBarStyle
    {
        get => (StatusBarStyle)GetValue(StatusBarStyleProperty);
        set => SetValue(StatusBarStyleProperty, value);
    }

    public static readonly BindableProperty TitleBarBackgroundColorProperty =
        BindableProperty.Create(
            nameof(TitleBarBackgroundColor),
            typeof(Color),
            typeof(BrowserPage),
            defaultValue: Color.FromArgb("#f3f4f6"));

    public Color TitleBarBackgroundColor
    {
        get => (Color)GetValue(TitleBarBackgroundColorProperty);
        set => SetValue(TitleBarBackgroundColorProperty, value);
    }

    public static readonly BindableProperty TitleTextColorProperty =
        BindableProperty.Create(
            nameof(TitleTextColor),
            typeof(Color),
            typeof(BrowserPage),
            defaultValue: Colors.Black);

    public Color TitleTextColor
    {
        get => (Color)GetValue(TitleTextColorProperty);
        set => SetValue(TitleTextColorProperty, value);
    }

    public static readonly BindableProperty AccentColorProperty =
        BindableProperty.Create(
            nameof(AccentColor),
            typeof(Color),
            typeof(BrowserPage),
            defaultValue: Color.FromArgb("#7cabff"));

    public Color AccentColor
    {
        get => (Color)GetValue(AccentColorProperty);
        set => SetValue(AccentColorProperty, value);
    }

    public BrowserPage(string url)
    {
        _url = url;
        InitializeComponent();
        BindingContext = this;
        ApplyTheme();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();

        if (!string.IsNullOrWhiteSpace(_url))
        {
            try
            {
                var uri = new Uri(_url);
                titleLabel.Text = uri.Host;
            }
            catch
            {
                titleLabel.Text = "网页";
            }

            webView.Source = _url;
        }
    }

    private void ApplyTheme()
    {
        var isDark = Application.Current?.RequestedTheme == AppTheme.Dark;
        if (isDark != true)
        {
            StatusBarColor = Color.FromArgb("#ffffff");
            StatusBarStyle = StatusBarStyle.DarkContent;
            TitleBarBackgroundColor = Color.FromArgb("#ffffff");
            TitleTextColor = Colors.Black;
            AccentColor = Color.FromArgb("#92949c");
            BackgroundColor = Colors.White;
        }
        else
        {
            StatusBarColor = Color.FromArgb("#1f1f1f");
            StatusBarStyle = StatusBarStyle.LightContent;
            TitleBarBackgroundColor = Color.FromArgb("#1f1f1f");
            TitleTextColor = Colors.White;
            AccentColor = Color.FromArgb("#989aa2");
            BackgroundColor = Color.FromArgb("#000000");
        }
    }

    private void OnWebViewNavigating(object sender, WebNavigatingEventArgs e)
    {
        activityIndicator.IsRunning = true;
        activityIndicator.IsVisible = true;
    }

    private void OnWebViewNavigated(object sender, WebNavigatedEventArgs e)
    {
        activityIndicator.IsRunning = false;
        activityIndicator.IsVisible = false;

        if (!string.IsNullOrWhiteSpace(e.Url))
        {
            try
            {
                var uri = new Uri(e.Url);
                titleLabel.Text = uri.Host;
            }
            catch
            {
                titleLabel.Text = "网页";
            }
        }
    }

    private async void OnBackClicked(object sender, EventArgs e)
    {
        await Navigation.PopAsync();
    }

    private async void OnCloseClicked(object sender, EventArgs e)
    {
        await Navigation.PopAsync();
    }

    private void OnRefreshClicked(object sender, EventArgs e)
    {
        webView.Reload();
    }
}