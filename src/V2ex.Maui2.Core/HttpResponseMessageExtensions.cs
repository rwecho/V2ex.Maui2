using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using V2ex.Maui2.Core.Constants;
using V2ex.Maui2.Core.Utilities;

namespace V2ex.Maui2.Core;

public static class HttpResponseMessageExtensions
{
    public static async Task<T?> ReadFromJson<T>(this HttpResponseMessage response)
    {
        CheckStatusCode(response);
        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public static async Task<T> GetEncapsulatedData<T>(this HttpResponseMessage response,
        ILogger? logger = null)
    {
        logger ??= NullLogger.Instance;
        CheckStatusCode(response);

        var sw = ValueStopwatch.StartNew();

        var content = await response.Content.ReadAsStringAsync();
        logger.LogDebug("Reading content as string completed, elapsed {Elapsed}", sw.Elapsed);
        var document = new HtmlDocument();
        document.LoadHtml(content);

        var sw2 = ValueStopwatch.StartNew();
        var result = document.DocumentNode.GetEncapsulatedData<T>();
        logger.LogDebug("GetEncapsulatedData completed, elapsed {Elapsed}", sw2.Elapsed);
        return result;
    }

    private static void CheckStatusCode(HttpResponseMessage response)
    {
        var statusCode = (int)response.StatusCode;

        if (statusCode == Constants.ApiConstants.HttpStatusCodes.Unauthorized ||
            statusCode == Constants.ApiConstants.HttpStatusCodes.Forbidden)
        {
            throw new NotAuthorizedException();
        }

        if (statusCode >= 400 && statusCode < 500)
        {
            throw new BadRequestException(response.ReasonPhrase ?? "Bad Request");
        }

        if (statusCode >= 500)
        {
            throw new ServerErrorException(response.ReasonPhrase ?? "Server Error");
        }
    }

    public static async Task<T> GetEncapsulatedData<T>(this HttpResponseMessage response,
        Action<HtmlNode> handleNode,
        ILogger? logger = null)
    {
        logger ??= NullLogger.Instance;
        CheckStatusCode(response);

        var sw = ValueStopwatch.StartNew();
        var content = await response.Content.ReadAsStringAsync();
        logger.LogDebug("Reading content as string completed, elapsed {Elapsed}", sw.Elapsed);
        var document = new HtmlDocument();
        document.LoadHtml(content);
        handleNode(document.DocumentNode);
        var sw2 = ValueStopwatch.StartNew();
        var result = document.DocumentNode.GetEncapsulatedData<T>();
        logger.LogDebug("GetEncapsulatedData completed, elapsed {Elapsed}", sw2.Elapsed);
        return result;
    }

    public static async Task<T> GetEncapsulatedData<T, TError>(this HttpResponseMessage response,
        Action<TError> handleError,
        ILogger? logger = null)
    {
        logger ??= NullLogger.Instance;
        CheckStatusCode(response);
        var sw = ValueStopwatch.StartNew();
        var content = await response.Content.ReadAsStringAsync();
        logger?.LogDebug("Reading content as string completed, elapsed {Elapsed}", sw.Elapsed);
        var document = new HtmlDocument();
        document.LoadHtml(content);

        var sw2 = ValueStopwatch.StartNew();
        var error = document.DocumentNode.GetEncapsulatedData<TError>();
        handleError(error);
        var result = document.DocumentNode.GetEncapsulatedData<T>();
        logger?.LogDebug("GetEncapsulatedData completed, elapsed {Elapsed}", sw2.Elapsed);
        return result;
    }
}
