
using System.Net;
using System.Text.Json;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services;

/// <summary>
/// MAUI 平台的 Cookie 存储实现
/// </summary>
public class MauiCookieStorage : ICookieContainerStorage
{
    private const string CookiesKey = "v2ex_cookies";

    private readonly CookieContainer _cookieContainer = new CookieContainer();


    public CookieContainer GetCookieContainer()
    {
        var cookiesValue = Preferences.Get(CookiesKey, "");

        if (string.IsNullOrEmpty(cookiesValue))
        {
            return _cookieContainer;
        }

        var cookies = JsonSerializer.Deserialize<List<Cookie>>(cookiesValue) ?? [];

        foreach (var cookie in cookies)
        {
            _cookieContainer.Add(cookie);
        }
        return _cookieContainer;
    }

    public void SaveCookies()
    {
        var cookies = this._cookieContainer.GetAllCookies()
              .Cast<Cookie>()
              .Select(x => new { x.Name, x.Value, x.Domain, x.Path, x.Expires, x.Secure, x.HttpOnly })
              .ToArray();

        var cookiesValue = JsonSerializer.Serialize(cookies);
        Preferences.Set(CookiesKey, cookiesValue);
    }

    public void ClearCookies()
    {
        // 1. Native Clear (Platform Specific) - Critical for iOS/Android where HttpClient uses native handlers
#if IOS || MACCATALYST
        try
        {
            // Clear NSHttpCookieStorage (Used by NSUrlSessionHandler / HttpClient)
            var storage = Foundation.NSHttpCookieStorage.SharedStorage;
            if (storage.Cookies != null)
            {
                foreach (var cookie in storage.Cookies)
                {
                    storage.DeleteCookie(cookie);
                }
            }
            Foundation.NSUserDefaults.StandardUserDefaults.Synchronize();

            // Clear WKWebsiteDataStore (Used by WebView)
            // RemoveDataOfTypes is void-returning with a completion handler, fitting our void method signature.
            WebKit.WKWebsiteDataStore.DefaultDataStore.RemoveDataOfTypes(
                WebKit.WKWebsiteDataStore.AllWebsiteDataTypes,
                Foundation.NSDate.FromTimeIntervalSince1970(0),
                () => {
                    System.Diagnostics.Debug.WriteLine("[MauiCookieStorage] WKWebsiteDataStore cleared.");
                }
            );
        }
        catch (Exception ex)
        {
             Console.WriteLine($"[MauiCookieStorage] iOS native clear failed: {ex.Message}");
        }
#endif
        foreach (Cookie cookie in this._cookieContainer.GetAllCookies())
        {
            cookie.Expires = DateTime.UtcNow.AddYears(-1);
        }

        // 3. Clear Persistence
        Preferences.Set(CookiesKey, JsonSerializer.Serialize(Array.Empty<Cookie>()));
    }

}
