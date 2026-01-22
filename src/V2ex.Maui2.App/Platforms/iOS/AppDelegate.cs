using System.Diagnostics;
using Foundation;
using Plugin.Firebase.Core.Platforms.iOS;
using Plugin.Firebase.Crashlytics;

namespace V2ex.Maui2.App;

[Register("AppDelegate")]
public class AppDelegate : MauiUIApplicationDelegate
{
	public override bool WillFinishLaunching(UIKit.UIApplication application, NSDictionary? launchOptions)
	{
		try
		{

			CrossFirebase.Initialize();
		}
		catch (Exception ex)
		{
			// ignore - don't crash startup if Firebase isn't configured
			Trace.WriteLine($"Firebase initialization error: {ex}");
		}

		return base.WillFinishLaunching(application, launchOptions);
	}

	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
