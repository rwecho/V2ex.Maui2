using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;

namespace V2ex.Maui2.Core.Security;

public class CookieOperations : ICookieOperations
{
    private readonly CookieContainer _cookieContainer;

    public CookieOperations(CookieContainer cookieContainer)
    {
        _cookieContainer = cookieContainer ?? throw new ArgumentNullException(nameof(cookieContainer));
    }

    public void AddCookie(Cookie cookie)
    {
        if (cookie == null)
        {
            throw new ArgumentNullException(nameof(cookie));
        }

        _cookieContainer.Add(cookie);
    }

    public void AddCookie(string name, string value, string domain, string path = "/")
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Cookie name cannot be empty", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Cookie value cannot be empty", nameof(value));
        }

        if (string.IsNullOrWhiteSpace(domain))
        {
            throw new ArgumentException("Cookie domain cannot be empty", nameof(domain));
        }

        var cookie = new Cookie(name, value, path, domain);
        _cookieContainer.Add(cookie);
    }

    public Cookie? GetCookie(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Cookie name cannot be empty", nameof(name));
        }

        return _cookieContainer.GetAllCookies().FirstOrDefault(c => c.Name == name);
    }

    public Cookie? GetCookie(Uri uri, string name)
    {
        if (uri == null)
        {
            throw new ArgumentNullException(nameof(uri));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Cookie name cannot be empty", nameof(name));
        }

        var cookies = _cookieContainer.GetCookies(uri);
        foreach (Cookie cookie in cookies)
        {
            if (cookie.Name == name)
            {
                return cookie;
            }
        }

        return null;
    }

    public IEnumerable<Cookie> GetAllCookies()
    {
        return _cookieContainer.GetAllCookies();
    }

    public IEnumerable<Cookie> GetCookies(Uri uri)
    {
        if (uri == null)
        {
            throw new ArgumentNullException(nameof(uri));
        }

        return _cookieContainer.GetCookies(uri).Cast<Cookie>();
    }

    public void RemoveCookie(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Cookie name cannot be empty", nameof(name));
        }

        var cookies = _cookieContainer.GetAllCookies().Where(c => c.Name == name).ToList();
        foreach (var cookie in cookies)
        {
            cookie.Expired = true;
        }
    }

    public void RemoveCookie(Uri uri, string name)
    {
        if (uri == null)
        {
            throw new ArgumentNullException(nameof(uri));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Cookie name cannot be empty", nameof(name));
        }

        var cookies = _cookieContainer.GetCookies(uri);
        foreach (Cookie cookie in cookies)
        {
            if (cookie.Name == name)
            {
                cookie.Expired = true;
                return;
            }
        }
    }

    public void Clear()
    {
        var cookies = _cookieContainer.GetAllCookies().ToList();
        foreach (var cookie in cookies)
        {
            cookie.Expired = true;
        }
    }

    public void Clear(Uri uri)
    {
        if (uri == null)
        {
            throw new ArgumentNullException(nameof(uri));
        }

        var cookies = _cookieContainer.GetCookies(uri).Cast<Cookie>().ToList();
        foreach (var cookie in cookies)
        {
            cookie.Expired = true;
        }
    }

    public bool HasCookie(string name)
    {
        return GetCookie(name) != null;
    }

    public bool HasCookie(Uri uri, string name)
    {
        return GetCookie(uri, name) != null;
    }
}