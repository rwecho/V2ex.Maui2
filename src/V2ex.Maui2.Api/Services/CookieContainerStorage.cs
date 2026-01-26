using System.Net;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Services;

public class CookieContainerStorage : ICookieContainerStorage
{
    private readonly CookieContainer _cookieContainer = new CookieContainer();
    public CookieContainer GetCookieContainer()
    {
        return _cookieContainer;
    }
}