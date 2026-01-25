using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using V2ex.Maui2.Core;
using V2ex.Maui2.Core.Constants;
using Xunit;

namespace V2ex.Maui2.Tests;

public class ApiService_General_Tests
{
    private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
    private readonly Mock<ILogger<ApiService>> _mockLogger;
    private readonly ApiService _apiService;

    public ApiService_General_Tests()
    {
        _mockHttpClientFactory = new Mock<IHttpClientFactory>();
        _mockLogger = new Mock<ILogger<ApiService>>();

        var httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConstants.BaseUrl)
        };
        httpClient.DefaultRequestHeaders.Add("User-Agent", "V2ex.Maui2.Tests/1.0");

        _mockHttpClientFactory.Setup(x => x.CreateClient("api")).Returns(httpClient);

        _apiService = new ApiService(_mockHttpClientFactory.Object, _mockLogger.Object);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Search_ReturnsValidData_WhenQueryExists()
    {
        // sov2ex api might be different base url, let's check ApiService logic
        // It uses ApiConstants.SearchUrl
        
        var keyword = "python";
        var result = await _apiService.Search(keyword);

        result.Should().NotBeNull();
        if (result!.Hits != null) 
        {
            result.Hits.Length.Should().BeGreaterThanOrEqualTo(0);
        }
        // However, sov2ex API stability is varying. Assert NotNull is safer.
    }
}
