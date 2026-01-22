using Microsoft.Extensions.DependencyInjection;

namespace V2ex.Maui2.App;

public partial class App : Application
{
	/// <summary>
	/// Raised when the app returns to foreground.
	/// </summary>
	public static event Action? AppResumed;

	/// <summary>
	/// Raised when the app goes to background.
	/// </summary>
	public static event Action? AppSlept;

	/// <summary>
	/// Last time the app entered background.
	/// Useful for deciding whether to reload the WebView after a long suspend.
	/// </summary>
	public static DateTimeOffset? LastSleepTime { get; private set; }

	public App()
	{
		InitializeComponent();
	}

	protected override void OnSleep()
	{
		LastSleepTime = DateTimeOffset.UtcNow;
		AppSlept?.Invoke();
		base.OnSleep();
	}

	protected override void OnResume()
	{
		AppResumed?.Invoke();
		base.OnResume();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		return new Window(new AppShell());
	}
}