using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace V2ex.Maui2.Core;

public class ApiHttpClientHandler : HttpClientHandler
{
    public ApiHttpClientHandler(
        ICookieContainerStorage cookieContainerStorage)
    {
        this.CookieContainer = cookieContainerStorage.GetCookieContainer();
        this.UseCookies = true;
        this.UseDefaultCredentials = false;
        this.AllowAutoRedirect = false;
        this.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);
        return response;
    }
}
