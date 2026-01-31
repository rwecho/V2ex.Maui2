using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace V2ex.Maui2.Core;

public class ApiHttpClientHandler : HttpClientHandler
{
    private readonly ILogger<ApiHttpClientHandler> _logger;
    private readonly IConnectivityService? _connectivityService;
    private readonly string _cacheDirectory;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromDays(7);

    /// <summary>
    /// Indicates if the last HTTP response was served from cache.
    /// </summary>
    public static bool LastResponseFromCache { get; private set; }

    public ApiHttpClientHandler(ICookieContainerStorage cookieContainerStorage, ILogger<ApiHttpClientHandler> logger, IConnectivityService? connectivityService = null)
    {
        _logger = logger;
        _connectivityService = connectivityService;
        this.CookieContainer = cookieContainerStorage.GetCookieContainer();
        this.UseCookies = true;
        this.UseDefaultCredentials = false;
        this.AllowAutoRedirect = false;
        this.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;

        // Initialize cache directory
        _cacheDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "http_cache");
        if (!Directory.Exists(_cacheDirectory))
        {
            Directory.CreateDirectory(_cacheDirectory);
        }
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Request: {Method} {Uri}", request.Method, request.RequestUri);

        // Only cache GET requests
        bool isCacheable = request.Method == HttpMethod.Get && request.RequestUri != null;
        string? cacheKey = isCacheable ? GetCacheKey(request.RequestUri!) : null;

        bool isOffline = _connectivityService != null && !_connectivityService.IsConnected;
        if (isOffline && isCacheable && cacheKey != null)
        {
            _logger.LogInformation("OFFLINE: Attempting cache for {Uri}", request.RequestUri);
            var offlineCacheResponse = await TryGetCachedResponseAsync(cacheKey, request.RequestUri!, ignoreExpiry: true);
            if (offlineCacheResponse != null)
            {
                _logger.LogInformation("OFFLINE: Cache HIT for {Uri}", request.RequestUri);
                LastResponseFromCache = true;
                return offlineCacheResponse;
            }
            _logger.LogWarning("OFFLINE: No cache available for {Uri}", request.RequestUri);
        }

        // Fetch from network
        HttpResponseMessage response;
        try
        {
            response = await base.SendAsync(request, cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException || ex is TaskCanceledException)
        {
            _logger.LogWarning(ex, "Network request failed for {Uri}", request.RequestUri);

            // Fallback to stale cache on network error
            if (isCacheable && cacheKey != null)
            {
                var staleResponse = await TryGetCachedResponseAsync(cacheKey, request.RequestUri!, ignoreExpiry: true);
                if (staleResponse != null)
                {
                    _logger.LogInformation("Cache FALLBACK (stale) for {Uri}", request.RequestUri);
                    LastResponseFromCache = true;
                    return staleResponse;
                }
            }
            throw;
        }

        _logger.LogInformation("Response: {StatusCode} {ReasonPhrase}", response.StatusCode, response.ReasonPhrase);

        // Response is from network, not cache
        LastResponseFromCache = false;

        // Cache successful responses
        if (isCacheable && cacheKey != null && response.IsSuccessStatusCode)
        {
            await CacheResponseAsync(cacheKey, response);
        }

        return response;
    }

    private string GetCacheKey(Uri uri)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(uri.ToString()));
        return BitConverter.ToString(hash).Replace("-", "");
    }

    private string GetCachePath(string cacheKey) => Path.Combine(_cacheDirectory, $"{cacheKey}.json");

    private async Task<HttpResponseMessage?> TryGetCachedResponseAsync(string cacheKey, Uri requestUri, bool ignoreExpiry = false)
    {
        var cachePath = GetCachePath(cacheKey);
        if (!File.Exists(cachePath))
            return null;

        try
        {
            var json = await File.ReadAllTextAsync(cachePath);
            var cacheEntry = JsonSerializer.Deserialize<CacheEntry>(json);

            if (cacheEntry == null)
                return null;

            // Check expiry
            if (!ignoreExpiry && DateTime.UtcNow - cacheEntry.CachedAt > CacheTtl)
            {
                _logger.LogDebug("Cache expired for {Uri}", requestUri);
                return null;
            }

            var response = new HttpResponseMessage((HttpStatusCode)cacheEntry.StatusCode)
            {
                Content = new StringContent(cacheEntry.Body, Encoding.UTF8, cacheEntry.ContentType ?? "text/html")
            };

            // Add custom header to indicate this is from cache
            response.Headers.Add("X-From-Cache", "true");

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read cache for {Uri}", requestUri);
            return null;
        }
    }

    private async Task CacheResponseAsync(string cacheKey, HttpResponseMessage response)
    {
        try
        {
            await response.Content.LoadIntoBufferAsync();
            var body = await response.Content.ReadAsStringAsync();
            var contentType = response.Content.Headers.ContentType?.MediaType;

            var cacheEntry = new CacheEntry
            {
                StatusCode = (int)response.StatusCode,
                Body = body,
                ContentType = contentType,
                CachedAt = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(cacheEntry);
            await File.WriteAllTextAsync(GetCachePath(cacheKey), json);

            _logger.LogDebug("Cached response for {Uri}", response.RequestMessage?.RequestUri);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache response");
        }
    }

    private class CacheEntry
    {
        public int StatusCode { get; set; }
        public string Body { get; set; } = "";
        public string? ContentType { get; set; }
        public DateTime CachedAt { get; set; }
    }
}
