using System.Net;

namespace V2ex.Maui2.Core;

public interface ICookieContainerStorage
{
    CookieContainer GetCookieContainer();
}