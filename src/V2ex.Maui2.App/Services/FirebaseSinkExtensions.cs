using Serilog;
using Serilog.Configuration;

namespace V2ex.Maui2.App.Services;

public static class FirebaseSinkExtensions
{
    public static LoggerConfiguration FirebaseCrashlytics(
        this LoggerSinkConfiguration loggerConfiguration,
        IFormatProvider? formatProvider = null)
    {
        return loggerConfiguration.Sink(new FirebaseCrashlyticsSink(formatProvider!));
    }
}
