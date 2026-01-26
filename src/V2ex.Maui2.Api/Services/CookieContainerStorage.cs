using System.Net;
using System.Text.Json;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Services;


public class CookieContainerStorage : ICookieContainerStorage
{
    private const string CookiesKey = "v2ex_cookies";

    private readonly CookieContainer _cookieContainer = new CookieContainer();

    public void ClearCookies()
    {
        foreach (Cookie cookie in this._cookieContainer.GetAllCookies())
        {
            cookie.Expires = DateTime.Now.AddDays(-1);
        }
        Preferences.Set(CookiesKey, JsonSerializer.Serialize(Array.Empty<Cookie>()));
    }

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

}