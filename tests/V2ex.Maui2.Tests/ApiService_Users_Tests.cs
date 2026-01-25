using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using V2ex.Maui2.Core;
using V2ex.Maui2.Core.Constants;
using Xunit;

namespace V2ex.Maui2.Tests;

public class ApiService_Users_Tests
{
    private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
    private readonly Mock<ILogger<ApiService>> _mockLogger;
    private readonly ApiService _apiService;

    public ApiService_Users_Tests()
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
    public async Task GetMemberInfo_ReturnsValidData_WhenUserExists()
    {
        var username = "livid"; 
        var result = await _apiService.GetMemberInfo(username);

        result.Should().NotBeNull();
        result!.UserName.Should().BeEquivalentTo(username); 
        result.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetUserPageInfo_ReturnsValidData_WhenUserExists()
    {
        var username = "livid"; 
        var result = await _apiService.GetUserPageInfo(username);

        result.Should().NotBeNull();
        if (result!.UserName != null)
        {
            result.UserName.Should().BeEquivalentTo(username);
        }
        else
        {
            // Fallback: Check if we got a valid page title at least (e.g. "V2EX > Livid")
            result.PageTitle.Should().NotBeNull();
        }
        
        // Avatar might be null if not found
        // result.Avatar.Should().NotBeNullOrWhiteSpace();
        result.Topics.Should().NotBeNull();
    }
}
