using System.Text.Json;

namespace V2ex.Maui2.Api.Services;

public static class Preferences
{
    public static string Get(string key, string defaultValue)
    {

        var filename = "preferences.json";
        if (!File.Exists(filename))
        {
            return defaultValue;
        }

        var json = File.ReadAllText(filename);
        var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>
        {
            { key, defaultValue }
        };
        return dict.ContainsKey(key) ? dict[key] : defaultValue;
    }

    public static void Set(string key, string value)
    {
        var filename = "preferences.json";
        Dictionary<string, string> dict;
        if (File.Exists(filename))
        {
            var json = File.ReadAllText(filename);
            dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>();
        }
        else
        {
            dict = new Dictionary<string, string>();
        }

        dict[key] = value;
        var newJson = JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true }); ;
        File.WriteAllText(filename, newJson);
    }
}
