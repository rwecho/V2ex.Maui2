using Foundation;
using Plugin.Firebase.Bundled.Platforms.iOS;
using Plugin.Firebase.Bundled.Shared;
using Plugin.Firebase.Crashlytics;

namespace V2ex.Maui2.App;

[Register("AppDelegate")]
public class AppDelegate : MauiUIApplicationDelegate
{
	public override bool WillFinishLaunching(UIKit.UIApplication application, NSDictionary? launchOptions)
	{
		try
		{
			CrossFirebase.Initialize(new CrossFirebaseSettings(
				isAnalyticsEnabled: true,
				isCrashlyticsEnabled: true,
				isStorageEnabled: true
			));
		}
		catch (Exception ex)
		{
			// ignore - don't crash startup if Firebase isn't configured
		}

		return base.WillFinishLaunching(application, launchOptions);
	}

	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
