using Microsoft.Extensions.Logging;
using Refit;
using Serilog;
using System.Text.Json;
using V2ex.Maui2.App.Services.Bridge;
using V2ex.Maui2.Core.Services.Interfaces;
using V2ex.Maui2.App.Services.V2ex;
using System.Net;
using CommunityToolkit.Maui;

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

		// 注册 Refit HTTP 客户端 - V2EX JSON API
		var v2exJsonOptions = new JsonSerializerOptions
		{
			PropertyNameCaseInsensitive = true,
			PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
		};

		builder.Services.AddRefitClient<IV2exJsonApi>(new RefitSettings
		{
			ContentSerializer = new SystemTextJsonContentSerializer(v2exJsonOptions)
		})
		.ConfigureHttpClient(client =>
		{
			client.BaseAddress = new Uri("https://proxy.0x2a.top/https://www.v2ex.com");
			// 设置 User-Agent 模拟浏览器
			client.DefaultRequestHeaders.Add("User-Agent",
				"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1");
		})
		.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
		{
			AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
		})
		;

		// 注册 V2EX 服务
		builder.Services.AddSingleton<V2exJsonService>();

		// 注册 Bridge 服务
		builder.Services.AddSingleton<MauiBridge>();

#if DEBUG
		builder.Services.AddHybridWebViewDeveloperTools();
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
