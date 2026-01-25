using System.Collections.Generic;
using System.Net;

namespace V2ex.Maui2.Core.Security;

public interface ICookieStorage
{
    void SaveCookies(string cookieJson);
    string LoadCookies();
    void ClearCookies();
    bool HasValidCookies();
}