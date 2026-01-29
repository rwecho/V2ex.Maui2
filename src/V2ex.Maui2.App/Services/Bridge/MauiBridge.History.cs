using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    private const string HistoryKey = "viewing_history";
    private const int MaxHistoryCount = 100;

    public Task<string> GetHistoryAsync()
    {
        return ExecuteSafeAsync(() =>
        {
            var historyJson = Preferences.Default.Get(HistoryKey, "[]");
            var history = JsonSerializer.Deserialize<List<object>>(historyJson) ?? new List<object>();
            return Task.FromResult(history);
        });
    }

    public Task<string> RecordHistoryAsync(string itemJson)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            var historyJson = Preferences.Default.Get(HistoryKey, "[]");
            var history = JsonSerializer.Deserialize<List<JsonElement>>(historyJson) ?? new List<JsonElement>();

            var newItem = JsonSerializer.Deserialize<JsonElement>(itemJson);
            
            // Extract ID to check for duplicates
            if (newItem.TryGetProperty("id", out var idProp))
            {
                var id = idProp.GetInt32();
                // Remove existing entry with same ID
                history.RemoveAll(x => x.TryGetProperty("id", out var existingId) && existingId.GetInt32() == id);
            }

            // Insert at beginning
            history.Insert(0, newItem);

            // Cap at MaxHistoryCount
            if (history.Count > MaxHistoryCount)
            {
                history = history.Take(MaxHistoryCount).ToList();
            }

            Preferences.Default.Set(HistoryKey, JsonSerializer.Serialize(history, _jsonOptions));
            return Task.CompletedTask;
        });
    }

    public Task<string> RemoveHistoryAsync(int topicId)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            var historyJson = Preferences.Default.Get(HistoryKey, "[]");
            var history = JsonSerializer.Deserialize<List<JsonElement>>(historyJson) ?? new List<JsonElement>();

            history.RemoveAll(x => x.TryGetProperty("id", out var existingId) && existingId.GetInt32() == topicId);

            Preferences.Default.Set(HistoryKey, JsonSerializer.Serialize(history, _jsonOptions));
            return Task.CompletedTask;
        });
    }

    public Task<string> ClearHistoryAsync()
    {
        return ExecuteSafeVoidAsync(() =>
        {
            Preferences.Default.Remove(HistoryKey);
            return Task.CompletedTask;
        });
    }
}
