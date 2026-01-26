using V2ex.Maui2.Api.Services;
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
builder.Services.AddSingleton<ICookieContainerStorage, CookieContainerStorage>();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSingleton<ApiHttpClientHandler>();

// add http client and configure cookie handler
// enable CORS for api
builder.Services.AddHttpClient("api", client =>
{

})
    .ConfigurePrimaryHttpMessageHandler((sp) =>
    {
        return sp.GetRequiredService<ApiHttpClientHandler>();
    });

builder.Services.AddScoped<ApiService>();


var app = builder.Build();

app.UseCors();

app.MapControllers();

app.Run();
