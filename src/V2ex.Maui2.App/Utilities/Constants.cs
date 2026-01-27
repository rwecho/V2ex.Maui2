
namespace V2ex.Maui2.App.Utilities;

public static class UserAgentConstants
{
#if WINDOWS
    public const string UserAgent = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
#elif ANDROID
    public const string UserAgent = "Mozilla/5.0 (Linux; Android 10; Tablet; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";
#else
    public const string UserAgent = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
#endif
}
