using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;

namespace V2ex.Maui2.Core.Security;

public static class CookieContainerExtensions
{
    public static IEnumerable<Cookie> GetAllCookies(this CookieContainer container)
    {
        if (container == null)
        {
            throw new ArgumentNullException(nameof(container));
        }

        var cookies = new List<Cookie>();
        var table = typeof(CookieContainer).GetField("m_domainTable", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        if (table == null)
        {
            return cookies;
        }

        var domains = table.GetValue(container);

        if (domains == null)
        {
            return cookies;
        }

        foreach (var domain in (System.Collections.IDictionary)domains)
        {
        foreach (var path in (System.Collections.IDictionary)((System.Collections.DictionaryEntry)domain).Value)
        {
            var cookieCollection = (System.Net.CookieCollection)((System.Collections.DictionaryEntry)path).Value;
            foreach (Cookie cookie in cookieCollection)
            {
                cookies.Add(cookie);
            }
        }
        }

        return cookies;
    }
}