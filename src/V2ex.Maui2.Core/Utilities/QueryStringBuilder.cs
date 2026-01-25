using System.Collections.Generic;
using System.Linq;
using System.Net;

namespace V2ex.Maui2.Core.Utilities;

public static class QueryStringBuilder
{
    public static string Build(Dictionary<string, string> parameters)
    {
        if (parameters == null || parameters.Count == 0)
        {
            return string.Empty;
        }

        return string.Join("&", parameters.Select(x => $"{WebUtility.UrlEncode(x.Key)}={WebUtility.UrlEncode(x.Value)}"));
    }

    public static string Build(Dictionary<string, string> parameters, string baseUrl)
    {
        var queryString = Build(parameters);
        return string.IsNullOrEmpty(queryString) ? baseUrl : $"{baseUrl}?{queryString}";
    }

    public static string BuildFromObject(object obj)
    {
        if (obj == null)
        {
            return string.Empty;
        }

        var parameters = new Dictionary<string, string>();
        var properties = obj.GetType().GetProperties();

        foreach (var property in properties)
        {
            var value = property.GetValue(obj);
            if (value != null)
            {
                parameters[property.Name] = value.ToString()!;
            }
        }

        return Build(parameters);
    }
}