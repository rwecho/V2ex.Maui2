using Microsoft.Extensions.DependencyInjection;

namespace V2ex.Maui2.App;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		var handler = new Microsoft.Maui.Handlers.HybridWebViewHandler();
		return new Window(new AppShell());
	}
}