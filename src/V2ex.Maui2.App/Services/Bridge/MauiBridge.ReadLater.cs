using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace V2ex.Maui2.App.Services.Bridge;

public partial class MauiBridge
{
    private const string ReadLaterFolder = "read_later";

    public Task<string> SaveReadLaterTopicAsync(int topicId)
    {
        return ExecuteSafeVoidAsync(async () =>
        {
            // Fetch full topic detail to ensure we have content
            var topic = await apiService.GetTopicDetail(topicId);
            if (topic == null)
            {
                throw new Exception($"Failed to fetch topic {topicId}");
            }
            
            var folder = Path.Combine(FileSystem.AppDataDirectory, ReadLaterFolder);
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            var filePath = Path.Combine(folder, $"{topicId}.json");
            var json = JsonSerializer.Serialize(topic, _jsonOptions);
            await File.WriteAllTextAsync(filePath, json);
        });
    }

    public Task<string> GetReadLaterTopicsAsync()
    {
        return ExecuteSafeAsync(async () =>
        {
            var folder = Path.Combine(FileSystem.AppDataDirectory, ReadLaterFolder);
            if (!Directory.Exists(folder))
            {
                return new List<object>();
            }

            var files = Directory.GetFiles(folder, "*.json");
            var topics = new List<object>();

            foreach (var file in files)
            {
                try
                {
                    var json = await File.ReadAllTextAsync(file);
                    var topic = JsonSerializer.Deserialize<object>(json);
                    if (topic != null)
                    {
                        topics.Add(topic);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to read topic file: {FilePath}", file);
                }
            }

            // Sort by date? Usually files don't preserve order.
            // We can rely on frontend sorting or sort here by creation time if needed.
            // For now return unordered list.
            return topics;
        });
    }

    public Task<string> RemoveReadLaterTopicAsync(int topicId)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            var folder = Path.Combine(FileSystem.AppDataDirectory, ReadLaterFolder);
            var filePath = Path.Combine(folder, $"{topicId}.json");
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            
            return Task.CompletedTask;
        });
    }

    public Task<string> IsReadLaterTopicAsync(int topicId)
    {
        return ExecuteSafeAsync(() =>
        {
            var folder = Path.Combine(FileSystem.AppDataDirectory, ReadLaterFolder);
            var filePath = Path.Combine(folder, $"{topicId}.json");
            return Task.FromResult(File.Exists(filePath));
        });
    }
}
