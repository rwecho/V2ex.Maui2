using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using V2ex.Maui2.Api.Services;
using V2ex.Maui2.Api.Controllers;
using V2ex.Maui2.Core.Security;
using V2ex.Maui2.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ICookieStorage, SessionCookieStorage>();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddHttpClient("api", client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    AllowAutoRedirect = true,
    UseCookies = true,
    CookieContainer = new CookieContainer()
});

builder.Services.AddScoped<ApiService>();


var app = builder.Build();

app.UseCors();

app.MapControllers();

app.Run();
