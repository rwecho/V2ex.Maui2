using Microsoft.Extensions.Logging;
using Serilog;
using V2ex.Maui2.App.Services.Bridge;
using V2ex.Maui2.App.Services;
using CommunityToolkit.Maui;
using V2ex.Maui2.App.Utilities;
using V2ex.Maui2.Core;
using System.Net;

namespace V2ex.Maui2.App;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();

		// 配置 Serilog
		Log.Logger = new LoggerConfiguration()
			.MinimumLevel.Debug()
			.WriteTo.Console()
			.WriteTo.File(
				Path.Combine(FileSystem.AppDataDirectory, "logs", "v2ex-.txt"),
				rollingInterval: RollingInterval.Day,
				retainedFileCountLimit: 7,
				outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
			)
			.WriteTo.FirebaseCrashlytics()
			.CreateLogger();

		builder
			.UseMauiApp<App>()
			.UseMauiCommunityToolkit()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});

		// 添加 Serilog 日志
		builder.Services.AddLogging(loggingBuilder =>
		{
			loggingBuilder.ClearProviders();
			loggingBuilder.AddSerilog(dispose: true);
		});

		builder.Services.AddSingleton<ApiHttpClientHandler>();

		// add http client and configure cookie handler
		// enable CORS for api
		builder.Services.AddHttpClient("api", client =>
		{
			client.DefaultRequestHeaders.UserAgent.ParseAdd(UserAgentConstants.UserAgent);
		})
			.ConfigurePrimaryHttpMessageHandler((sp) => sp.GetRequiredService<ApiHttpClientHandler>())
		;

		// 注册认证和回复服务
		builder.Services.AddSingleton<ICookieContainerStorage, MauiCookieStorage>();


		// 注册 Bridge 服务
		builder.Services.AddSingleton<MauiBridge>();

		builder.Services.AddSingleton<ApiService>();

#if DEBUG
		builder.Services.AddHybridWebViewDeveloperTools();
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
