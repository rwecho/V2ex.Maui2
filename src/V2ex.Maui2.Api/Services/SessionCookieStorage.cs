using System;
using Microsoft.AspNetCore.Http;
using V2ex.Maui2.Core.Security;

namespace V2ex.Maui2.Api.Services;

public class SessionCookieStorage : ICookieStorage
{
    private readonly Dictionary<string, string> _storage = new();
    private const string CookiesKey = "v2ex_cookies";

    private readonly IHttpContextAccessor _httpContextAccessor;

    public SessionCookieStorage(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void SaveCookies(string cookieJson)
    {
        _storage[CookiesKey] = cookieJson;
        _httpContextAccessor.HttpContext?.Session?.SetString(CookiesKey, cookieJson);
    }

    public string LoadCookies()
    {
        var session = _httpContextAccessor.HttpContext?.Session;
        return session?.GetString(CookiesKey) ?? string.Empty;
    }

    public void ClearCookies()
    {
        _storage.Remove(CookiesKey);
        _httpContextAccessor.HttpContext?.Session?.Clear();
    }

    public bool HasValidCookies()
    {
        var cookieJson = LoadCookies();
        return !string.IsNullOrWhiteSpace(cookieJson);
    }
}