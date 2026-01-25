using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui.Alerts;
using Plugin.Firebase.Analytics;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services.Bridge;

/// <summary>
/// Maui Bridge 服务 - 用于与 JavaScript 通信
/// </summary>
public partial class MauiBridge(ApiService apiService, ILogger<MauiBridge> logger)
{
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    /// <summary>
    /// 获取平台信息（用于 React 环境检测）
    /// </summary>
    /// <returns>平台名称（iOS/Android/Mac/Windows/Unknown）</returns>
    public string GetPlatformInfo()
    {
        try
        {
            string platform = DeviceInfo.Platform.ToString() switch
            {
                "iOS" => "iOS",
                "Android" => "Android",
                "MacCatalyst" => "Mac",
                "WinUI" => "Windows",
                "Tizen" => "Tizen",
                "macOS" => "Mac",
                _ => "Unknown"
            };

            logger.LogInformation("Bridge: 获取平台信息 - {Platform}", platform);
            return platform;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取平台信息失败");
            return "Unknown";
        }
    }

    public Task<string?> GetStringValue(string key)
    {
        return Task.FromResult((string?)Preferences.Default.Get(key, string.Empty));
    }

    public Task SetStringValue(string key, string value)
    {
        Preferences.Default.Set(key, value);
        return Task.CompletedTask;
    }

    // show snackbar
    public void ShowSnackbar(string message)
    {
        Snackbar.Make(message).Show();
    }

    // show toast
    public void ShowToast(string message)
    {
        Toast.Make(message, CommunityToolkit.Maui.Core.ToastDuration.Short).Show();
    }

    public Task<SystemInfo> GetSystemInfo()
    {
        var systemInfo = new SystemInfo
        {
            Platform = DeviceInfo.Platform.ToString(),
            AppVersion = AppInfo.VersionString,
            DeviceModel = DeviceInfo.Model,
            Manufacturer = DeviceInfo.Manufacturer,
            DeviceName = DeviceInfo.Name,
            OperatingSystem = DeviceInfo.VersionString
        };
        return Task.FromResult(systemInfo);
    }

    /// <summary>
    /// 前端通过桥调用，记录 Analytics 事件（统一在原生侧上报）
    /// 期望 JSON 结构: {"name":"event_name","params":{"key":"value", "num":123, "flag":true}}
    /// </summary>
    public Task<string> TrackAnalyticsEventAsync(string eventName,
        Dictionary<string, object?>? parameters = null)
    {
        try
        {
            CrossFirebaseAnalytics.Current.LogEvent(eventName!, parameters);
            logger.LogInformation("Analytics event sent via bridge: {Event}", eventName);
            return Task.FromResult("ok");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to log analytics event via bridge: {Event}", eventName);
            return Task.FromResult($"error: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取日志文件列表
    /// </summary>
    /// <returns>日志文件列表（JSON 格式）</returns>
    public async Task<string> GetLogFilesAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 获取日志文件列表");

            var logsDir = Path.Combine(FileSystem.AppDataDirectory, "logs");

            if (!Directory.Exists(logsDir))
            {
                logger.LogWarning("Logs directory does not exist: {LogsDir}", logsDir);
                return JsonSerializer.Serialize(new { files = new List<object>() });
            }

            var files = Directory.GetFiles(logsDir, "v2ex-*.txt")
                .OrderByDescending(f => File.GetLastWriteTime(f))
                .Select(f => new
                {
                    name = Path.GetFileName(f),
                    path = f,
                    size = new FileInfo(f).Length,
                    lastModified = File.GetLastWriteTime(f)
                })
                .ToList();

            logger.LogInformation("Found {Count} log files", files.Count);

            return JsonSerializer.Serialize(new { files }, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 获取日志文件列表失败");
            return JsonSerializer.Serialize(new { error = ex.Message, files = new List<object>() });
        }
    }

    /// <summary>
    /// 读取指定日志文件的内容
    /// </summary>
    /// <param name="fileName">日志文件名</param>
    /// <returns>日志文件内容</returns>
    public async Task<string> GetLogFileContentAsync(string fileName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return JsonSerializer.Serialize(new { error = "Invalid fileName" });
            }

            // 防止路径穿越攻击
            var safeFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(FileSystem.AppDataDirectory, "logs", safeFileName);

            if (!File.Exists(filePath))
            {
                logger.LogWarning("Log file not found: {FilePath}", filePath);
                return JsonSerializer.Serialize(new { error = "File not found" });
            }

            logger.LogInformation("Bridge: 读取日志文件 {FileName}", fileName);

            var content = await File.ReadAllTextAsync(filePath);

            return JsonSerializer.Serialize(new
            {
                fileName = safeFileName,
                content = content,
                size = new FileInfo(filePath).Length,
                lastModified = File.GetLastWriteTime(filePath)
            }, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 读取日志文件失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 删除指定日志文件
    /// </summary>
    /// <param name="fileName">日志文件名</param>
    /// <returns>操作结果</returns>
    public async Task<string> DeleteLogFileAsync(string fileName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return JsonSerializer.Serialize(new { error = "Invalid fileName" });
            }

            var safeFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(FileSystem.AppDataDirectory, "logs", safeFileName);

            if (!File.Exists(filePath))
            {
                return JsonSerializer.Serialize(new { error = "File not found" });
            }

            logger.LogInformation("Bridge: 删除日志文件 {FileName}", fileName);

            File.Delete(filePath);

            return JsonSerializer.Serialize(new { success = true, message = "File deleted successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 删除日志文件失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// 清空所有日志文件
    /// </summary>
    /// <returns>操作结果</returns>
    public async Task<string> ClearAllLogsAsync()
    {
        try
        {
            logger.LogInformation("Bridge: 清空所有日志文件");

            var logsDir = Path.Combine(FileSystem.AppDataDirectory, "logs");

            if (!Directory.Exists(logsDir))
            {
                return JsonSerializer.Serialize(new { success = true, message = "Logs directory does not exist" });
            }

            var files = Directory.GetFiles(logsDir, "v2ex-*.txt");
            foreach (var file in files)
            {
                try
                {
                    File.Delete(file);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to delete log file: {FilePath}", file);
                }
            }

            return JsonSerializer.Serialize(new { success = true, message = $"Deleted {files.Length} log files" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 清空日志文件失败");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    public Task OpenExternalLinkAsync(string url)
    {
        try
        {
            logger.LogInformation("Bridge: 打开外部链接: {Url}", url);

            if (string.IsNullOrWhiteSpace(url))
            {
                throw new ArgumentException("URL cannot be empty", nameof(url));
            }

            MainThread.BeginInvokeOnMainThread(async () =>
            {
                try
                {
                    var browserPage = new BrowserPage(url);
                    var window = Application.Current?.Windows[0];
                    var mainPage = window?.Page;
                    if (mainPage != null)
                    {
                        await mainPage.Navigation.PushAsync(browserPage);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to open browser page for URL: {Url}", url);
                    await Browser.Default.OpenAsync(url);
                }
            });

            return Task.CompletedTask;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: 打开外部链接失败");
            return Task.FromException(ex);
        }
    }
}