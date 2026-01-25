using System;
using System.Collections.Generic;
using System.Net;

namespace V2ex.Maui2.Core.Security;

public interface ICookieOperations
{
    void AddCookie(Cookie cookie);
    void AddCookie(string name, string value, string domain, string path = "/");
    Cookie? GetCookie(string name);
    Cookie? GetCookie(Uri uri, string name);
    IEnumerable<Cookie> GetAllCookies();
    IEnumerable<Cookie> GetCookies(Uri uri);
    void RemoveCookie(string name);
    void RemoveCookie(Uri uri, string name);
    void Clear();
    void Clear(Uri uri);
    bool HasCookie(string name);
    bool HasCookie(Uri uri, string name);
}