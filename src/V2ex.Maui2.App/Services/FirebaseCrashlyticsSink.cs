using Plugin.Firebase.Crashlytics;
using Serilog.Core;
using Serilog.Events;

namespace V2ex.Maui2.App.Services;

public class FirebaseCrashlyticsSink : ILogEventSink
{
    private readonly IFormatProvider _formatProvider;

    public FirebaseCrashlyticsSink(IFormatProvider formatProvider)
    {
        _formatProvider = formatProvider;
    }

    public void Emit(LogEvent logEvent)
    {
        try
        {
            // 1. 渲染日志消息
            var message = logEvent.RenderMessage(_formatProvider);

            // 加上日志级别前缀，方便在 Firebase 控制台看
            var finalMessage = $"[{logEvent.Level}] {message}";

            // 2. 记录到 Crashlytics 的 "Logs" 标签页 (作为崩溃前的上下文)
            // 注意：这些日志只有在发生崩溃或手动记录异常时才会上传
            CrossFirebaseCrashlytics.Current.Log(finalMessage);

            // 3. 如果包含异常 (Exception)，则作为一个"非致命错误"直接上传
            if (logEvent.Exception != null)
            {
                // 你也可以把 Serilog 的属性作为 Key-Value 对传进去
                // CrossFirebaseCrashlytics.Current.SetCustomKey("SourceContext", ...);

                CrossFirebaseCrashlytics.Current.RecordException(logEvent.Exception);
            }
        }
        catch (Exception)
        {
            // 防止日志系统本身崩溃导致 App 闪退，这里吞掉异常
        }
    }
}