using System.Diagnostics;
using Firebase.CloudMessaging;
using Foundation;
using Plugin.Firebase.Core.Platforms.iOS;
using Plugin.Firebase.Crashlytics;
using UIKit;
using UserNotifications;

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

	public override bool FinishedLaunching(UIKit.UIApplication application, NSDictionary? launchOptions)
	{
		// 1. 请求推送权限
		UNUserNotificationCenter.Current.RequestAuthorization(
			UNAuthorizationOptions.Alert | UNAuthorizationOptions.Badge | UNAuthorizationOptions.Sound,
			(approved, error) => { });

		// 2. 注册远程推送
		UIApplication.SharedApplication.RegisterForRemoteNotifications();
		return base.FinishedLaunching(application, launchOptions);
	}

	protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

	// 必须实现这个方法，Firebase 才能拿到 APNs Token
	[Export("application:didRegisterForRemoteNotificationsWithDeviceToken:")]
	public void RegisteredForRemoteNotifications(UIApplication application, NSData deviceToken)
	{
		// 告诉 Firebase 你的 APNs Token
		Messaging.SharedInstance.ApnsToken = deviceToken;
	}
}


