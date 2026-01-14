using System.Net;
using System.Text.Json;
using System.Threading.RateLimiting;
using Refit;
using Serilog;
using V2ex.Maui2.Core.Services.Interfaces;
using V2ex.Maui2.Core.Services.V2ex;

var builder = WebApplication.CreateBuilder(args);

// Serilog (console)
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: allow local React dev by default, configurable via appsettings.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
    ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Basic rate limiting to avoid hammering upstream during frontend development.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("per-ip", httpContext =>
    {
        var key = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: key,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            });
    });
});

// Refit client -> V2EX
var v2exJsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
};

builder.Services
    .AddRefitClient<IV2exJsonApi>(new RefitSettings
    {
        ContentSerializer = new SystemTextJsonContentSerializer(v2exJsonOptions)
    })
    .ConfigureHttpClient(client =>
    {
        var baseUrl = builder.Configuration["V2ex:BaseUrl"]
            ?? "https://www.v2ex.com";

        client.BaseAddress = new Uri(baseUrl);

        var userAgent = builder.Configuration["V2ex:UserAgent"];
        if (!string.IsNullOrWhiteSpace(userAgent))
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", userAgent);
        }

        client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
    })
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
        // 开发环境禁用 SSL 证书验证
        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
    });

// 注册 V2exJsonService 和 V2exHtmlParser
builder.Services.AddSingleton<HttpClient>(serviceProvider =>
{
    return new HttpClient(new HttpClientHandler
    {
        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
    })
    {
        Timeout = TimeSpan.FromSeconds(30)
    };
});
builder.Services.AddSingleton<V2exHtmlParser>();
builder.Services.AddSingleton<V2exJsonService>();

var app = builder.Build();

app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();

app.MapControllers();

app.Run();
