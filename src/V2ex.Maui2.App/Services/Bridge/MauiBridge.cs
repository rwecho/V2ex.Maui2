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
    /// Executes a bridge operation safely, handling exceptions and serializing the result.
    /// </summary>
    /// <typeparam name="T">The type of the result data.</typeparam>
    /// <param name="operation">The async operation to execute.</param>
    /// <param name="operationName">Name of the operation for logging.</param>
    /// <returns>A JSON string representing the result or error.</returns>
    private async Task<string> ExecuteSafeAsync<T>(Func<Task<T>> operation, [System.Runtime.CompilerServices.CallerMemberName] string operationName = "")
    {
        try
        {
            logger.LogInformation("Bridge: Start {Operation}", operationName);
            var result = await operation();
            return JsonSerializer.Serialize(result, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: Failed {Operation}", operationName);
            // Ensure error format is consistent: { error: "message" }
            return JsonSerializer.Serialize(new { error = ex.Message }, _jsonOptions);
        }
    }

    /// <summary>
    /// Executes a void bridge operation safely.
    /// </summary>
    /// <param name="operation">The async operation to execute.</param>
    /// <param name="operationName">Name of the operation for logging.</param>
    /// <returns>A JSON string representing success or error.</returns>
    private async Task<string> ExecuteSafeVoidAsync(Func<Task> operation, [System.Runtime.CompilerServices.CallerMemberName] string operationName = "")
    {
        try
        {
            logger.LogInformation("Bridge: Start {Operation}", operationName);
            await operation();
            return JsonSerializer.Serialize(new { success = true }, _jsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bridge: Failed {Operation}", operationName);
            return JsonSerializer.Serialize(new { error = ex.Message }, _jsonOptions);
        }
    }

    /// <summary>
    /// 获取平台信息（用于 React 环境检测）
    /// </summary>
    /// <returns>平台名称（iOS/Android/Mac/Windows/Unknown）</returns>
    public Task<string> GetPlatformInfo()
    {
        return ExecuteSafeAsync(() =>
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
            return Task.FromResult(new { platform });
        });
    }

    public Task<string> GetStringValue(string key)
    {
        return ExecuteSafeAsync(() => Task.FromResult(Preferences.Default.Get(key, string.Empty)));
    }

    public Task<string> SetStringValue(string key, string value)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            Preferences.Default.Set(key, value);
            return Task.CompletedTask;
        });
    }

    // show snackbar
    public Task<string> ShowSnackbar(string message)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            return MainThread.InvokeOnMainThreadAsync(() =>
            {
                Snackbar.Make(message).Show();
            });
        });
    }

    // show toast
    public Task<string> ShowToast(string message)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            return MainThread.InvokeOnMainThreadAsync(() =>
            {
                Toast.Make(message, CommunityToolkit.Maui.Core.ToastDuration.Short).Show();
            });
        });
    }

    public Task<string> GetSystemInfo()
    {
        return ExecuteSafeAsync(() =>
        {
            var displayVersion = AppInfo.Current.VersionString;
            var systemInfo = new SystemInfo
            {
                Platform = DeviceInfo.Platform.ToString(),
                AppVersion = displayVersion,
                DeviceModel = DeviceInfo.Model,
                Manufacturer = DeviceInfo.Manufacturer,
                DeviceName = DeviceInfo.Name,
                OperatingSystem = DeviceInfo.VersionString
            };
            logger.LogInformation("Bridge: 获取系统信息 - Version: {Version}", displayVersion);
            return Task.FromResult(systemInfo);
        });
    }

    /// <summary>
    /// 前端通过桥调用，记录 Analytics 事件（统一在原生侧上报）
    /// 期望 JSON 结构: {"name":"event_name","params":{"key":"value", "num":123, "flag":true}}
    /// </summary>
    public Task<string> TrackAnalyticsEventAsync(string eventName,
        Dictionary<string, object?>? parameters = null)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            CrossFirebaseAnalytics.Current.LogEvent(eventName!, parameters);
            logger.LogInformation("Analytics event sent via bridge: {Event}", eventName);
            return Task.CompletedTask;
        });
    }

    /// <summary>
    /// 获取日志文件列表
    /// </summary>
    /// <returns>日志文件列表（JSON 格式）</returns>
    public Task<string> GetLogFilesAsync()
    {
        return ExecuteSafeAsync(() =>
        {
            logger.LogInformation("Bridge: 获取日志文件列表");
            var logsDir = Path.Combine(FileSystem.AppDataDirectory, "logs");

            if (!Directory.Exists(logsDir))
            {
                logger.LogWarning("Logs directory does not exist: {LogsDir}", logsDir);
                return Task.FromResult((object)new { files = new List<object>() });
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
            return Task.FromResult((object)new { files });
        });
    }

    /// <summary>
    /// 读取指定日志文件的内容
    /// </summary>
    /// <param name="fileName">日志文件名</param>
    /// <returns>日志文件内容</returns>
    public Task<string> GetLogFileContentAsync(string fileName)
    {
        return ExecuteSafeAsync(async () =>
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new ArgumentException("Invalid fileName");
            }

            // 防止路径穿越攻击
            var safeFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(FileSystem.AppDataDirectory, "logs", safeFileName);

            if (!File.Exists(filePath))
            {
                logger.LogWarning("Log file not found: {FilePath}", filePath);
                throw new FileNotFoundException("File not found");
            }

            logger.LogInformation("Bridge: 读取日志文件 {FileName}", fileName);
            var content = await File.ReadAllTextAsync(filePath);

            return new
            {
                fileName = safeFileName,
                content = content,
                size = new FileInfo(filePath).Length,
                lastModified = File.GetLastWriteTime(filePath)
            };
        });
    }

    /// <summary>
    /// 获取当前网络连接状态
    /// </summary>
    /// <returns>JSON 格式结果，包含 isConnected 和 networkType</returns>
    public Task<string> GetNetworkStatusAsync()
    {
        return ExecuteSafeAsync(() =>
        {
            var networkAccess = Microsoft.Maui.Networking.Connectivity.Current.NetworkAccess;
            var isConnected = networkAccess == Microsoft.Maui.Networking.NetworkAccess.Internet;
            var networkType = networkAccess.ToString();

            logger.LogInformation("Bridge: 获取网络状态 - IsConnected: {IsConnected}, Type: {Type}", isConnected, networkType);

            return Task.FromResult(new
            {
                isConnected,
                networkType
            });
        }, "GetNetworkStatus");
    }

    /// <summary>
    /// 获取最近一次 HTTP 响应的缓存状态
    /// </summary>
    /// <returns>JSON 格式结果，包含 fromCache</returns>
    public Task<string> GetCacheStatusAsync()
    {
        return ExecuteSafeAsync(() =>
        {
            var fromCache = V2ex.Maui2.Core.ApiHttpClientHandler.LastResponseFromCache;

            logger.LogDebug("Bridge: 获取缓存状态 - FromCache: {FromCache}", fromCache);

            return Task.FromResult(new
            {
                fromCache
            });
        }, "GetCacheStatus");
    }

    /// <summary>
    /// 删除指定日志文件
    /// </summary>
    /// <param name="fileName">日志文件名</param>
    /// <returns>操作结果</returns>
    public Task<string> DeleteLogFileAsync(string fileName)
    {
        return ExecuteSafeAsync(() =>
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new ArgumentException("Invalid fileName");
            }

            var safeFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(FileSystem.AppDataDirectory, "logs", safeFileName);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("File not found");
            }

            logger.LogInformation("Bridge: 删除日志文件 {FileName}", fileName);
            File.Delete(filePath);

            return Task.FromResult(new { success = true, message = "File deleted successfully" });
        });
    }

    /// <summary>
    /// 清空所有日志文件
    /// </summary>
    /// <returns>操作结果</returns>
    public Task<string> ClearAllLogsAsync()
    {
        return ExecuteSafeAsync(() =>
        {
            logger.LogInformation("Bridge: 清空所有日志文件");
            var logsDir = Path.Combine(FileSystem.AppDataDirectory, "logs");

            if (!Directory.Exists(logsDir))
            {
                return Task.FromResult(new { success = true, message = "Logs directory does not exist" });
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
            return Task.FromResult(new { success = true, message = $"Deleted {files.Length} log files" });
        });
    }

    public Task<string> OpenExternalLinkAsync(string url)
    {
        return ExecuteSafeVoidAsync(async () =>
        {
            logger.LogInformation("Bridge: 打开外部链接: {Url}", url);
            if (string.IsNullOrWhiteSpace(url))
            {
                throw new ArgumentException("URL cannot be empty", nameof(url));
            }

            await MainThread.InvokeOnMainThreadAsync(async () =>
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
        });
    }

    /// <summary>
    /// 从相册选择图片并返回 Base64 编码数据
    /// </summary>
    /// <returns>JSON 格式结果，包含 base64 数据或错误信息</returns>
    public Task<string> PickImageAsync()
    {
        return ExecuteSafeAsync(async () =>
        {
            logger.LogInformation("Bridge: 开始选择图片");

            return await MainThread.InvokeOnMainThreadAsync(async () =>
            {
                try
                {
                    var photos = await MediaPicker.Default.PickPhotosAsync(new MediaPickerOptions
                    {
                        Title = "选择图片"
                    });

                    if (photos == null || !photos.Any())
                    {
                        return new { cancelled = true };
                    }

                    // 读取图片并转换为 Base64
                    var photo = photos.First();
                    using var stream = await photo.OpenReadAsync();
                    using var memoryStream = new MemoryStream();
                    await stream.CopyToAsync(memoryStream);
                    var bytes = memoryStream.ToArray();
                    var base64 = Convert.ToBase64String(bytes);

                    // 获取 MIME 类型
                    var contentType = photo.ContentType ?? "image/jpeg";

                    logger.LogInformation("Bridge: 图片选择成功, 大小: {Size} bytes, 类型: {ContentType}",
                        bytes.Length, contentType);

                    return (object)new
                    {
                        success = true,
                        base64 = base64,
                        contentType = contentType,
                        fileName = photo.FileName,
                        size = bytes.Length
                    };
                }
                catch (PermissionException)
                {
                    logger.LogWarning("Bridge: 相册访问权限被拒绝");
                    throw new Exception("需要相册访问权限");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Bridge: 图片选择时发生错误");
                    throw new Exception(ex.Message);
                }
            });
        });
    }

    /// <summary>
    /// 触发触觉反馈
    /// </summary>
    /// <param name="type">反馈类型：Light, Medium, Heavy, Click, DoubleClick</param>
    /// <returns></returns>
    public Task<string> HapticsAsync(string type)
    {
        return ExecuteSafeVoidAsync(() =>
        {
            logger.LogInformation("Bridge: 触发触觉反馈 {Type}", type);
            return MainThread.InvokeOnMainThreadAsync(() =>
            {
                try
                {
                    switch (type?.ToLower())
                    {
                        case "light":
                        case "click":
                            HapticFeedback.Default.Perform(HapticFeedbackType.Click);
                            break;
                        case "longpress":
                        case "heavy":
                            HapticFeedback.Default.Perform(HapticFeedbackType.LongPress);
                            break;
                        case "error":
                        case "doubleclick":
                            // 这里可以用 Vibration API 模拟更复杂的或者多次震动
                            // 目前暂时用 LongPress 或者 Click 代替
                            HapticFeedback.Default.Perform(HapticFeedbackType.Click);
                            break;
                        default:
                            HapticFeedback.Default.Perform(HapticFeedbackType.Click);
                            break;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to perform haptics");
                }
            });
        });
    }
}