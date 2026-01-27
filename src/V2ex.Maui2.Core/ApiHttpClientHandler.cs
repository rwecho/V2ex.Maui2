using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace V2ex.Maui2.Core;

public class ApiHttpClientHandler : HttpClientHandler
{
    private readonly ILogger<ApiHttpClientHandler> _logger;

    public ApiHttpClientHandler(ICookieContainerStorage cookieContainerStorage, ILogger<ApiHttpClientHandler> logger)
    {
        _logger = logger;
        this.CookieContainer = cookieContainerStorage.GetCookieContainer();
        this.UseCookies = true;
        this.UseDefaultCredentials = false;
        this.AllowAutoRedirect = false;
        this.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Request: {Method} {Uri}", request.Method, request.RequestUri);
        foreach (var header in request.Headers)
        {
            _logger.LogDebug("Request Header: {Key}: {Value}", header.Key, string.Join(", ", header.Value));
        }

        var cookies = this.CookieContainer.GetCookies(new Uri(request.RequestUri.GetLeftPart(UriPartial.Authority)));

        foreach (Cookie cookie in cookies)
        {
            _logger.LogDebug("Request Cookie: {Name}={Value}", cookie.Name, cookie.Value);
        }


        var response = await base.SendAsync(request, cancellationToken);

        var responseCookies = response.Headers.GetValues("Set-Cookie");
        foreach (var cookie in responseCookies)
        {
            _logger.LogDebug("Response Set-Cookie: {Cookie}", cookie);
        }

        _logger.LogInformation("Response: {StatusCode} {ReasonPhrase}", response.StatusCode, response.ReasonPhrase);

        // Peek at the response content if possible, but be careful not to consume the stream if it's not seekable/memory backed.
        // Actually, we can read it as string since we are likely bufferring it or using ReadAsStringAsync elsewhere.
        // But to be safe and avoiding side effects on the stream, we might skip full content logging or use a safe way.
        // Given the user wants to see "content", let's try reading it if it's text.
        // However, response.Content.ReadAsStringAsync() will buffer it.
        // Let's rely on the fact that we used AutomaticDecompression, so the stream is already wrapped.

        try
        {
            // We clone the content to read it without disturbing the original stream if possible, 
            // but HttpClient response content is usually read-once. 
            // Ideally we should LoadIntoBufferAsync() first.
            await response.Content.LoadIntoBufferAsync();
            var content = await response.Content.ReadAsStringAsync();
            if (content.Length > 1000)
            {
                _logger.LogDebug("Response Content (First 1000 chars): {Content}", content.Substring(0, 1000));
            }
            else
            {
                _logger.LogDebug("Response Content: {Content}", content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log response content");
        }

        return response;
    }
}
