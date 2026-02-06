using V2ex.Maui2.Core.Services;

namespace V2ex.Maui2.Api.Services;

public class PushService : IPushService
{
    public Task Register(string feedUrl)
    {
        return Task.CompletedTask;
    }
}