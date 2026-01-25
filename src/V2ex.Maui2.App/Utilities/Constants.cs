using Microsoft.Maui.Devices;

namespace V2ex.Maui2.App.Utilities;

public static class UserAgentConstants
{
    public static string GetUserAgent()
    {
        var version = DeviceInfo.Current.VersionString;
        var model = DeviceInfo.Current.Model;

#if ANDROID
        // Example: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36
        // We inject the actual Android version and Model
        return $"Mozilla/5.0 (Linux; Android {version}; {model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
#elif IOS || MACCATALYST
        // Example: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1
        // iOS version usually comes as "17.0", we might want "17_0" for the main part, but "Version/17.0" is fine.
        var osVersionUnderscore = version.Replace(".", "_");
        return $"Mozilla/5.0 (iPhone; CPU iPhone OS {osVersionUnderscore} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{version} Mobile/15E148 Safari/604.1";
#else
        // Fallback for Windows/Other
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
#endif
    }
}
