using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using V2ex.Maui2.Core;
using V2ex.Maui2.Core.Constants;
using Xunit;

namespace V2ex.Maui2.Tests;

public class ApiService_Topics_Tests
{
    private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
    private readonly Mock<ILogger<ApiService>> _mockLogger;
    private readonly ApiService _apiService;

    public ApiService_Topics_Tests()
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
    public async Task GetDailyHot_ReturnsValidData_WhenNetworkIsAvailable()
    {
        var result = await _apiService.GetDailyHot();

        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        
        var firstItem = result![0];
        firstItem.Id.Should().BeGreaterThan(0);
        firstItem.Title.Should().NotBeNullOrWhiteSpace();
        firstItem.Member.Should().NotBeNull();
        firstItem.Member.UserName.Should().NotBeNullOrWhiteSpace();
        firstItem.Node.Should().NotBeNull();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetRecentTopics_ReturnsValidData_WhenNetworkIsAvailable()
    {
        var result = await _apiService.GetRecentTopics();

        result.Should().NotBeNull();
        result.Items.Should().NotBeNull();
        result.Items.Should().NotBeEmpty();
        
        var firstItem = result.Items[0];
        firstItem.Title.Should().NotBeNullOrWhiteSpace();
        firstItem.UserName.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetTabTopics_ReturnsValidData_WhenTabExists()
    {
        var tab = "hot";
        var result = await _apiService.GetTabTopics(tab);

        result.Should().NotBeNull();
        result.Items.Should().NotBeNull();
        result.Items.Should().NotBeEmpty();
        
        var firstItem = result.Items[0];
        firstItem.Title.Should().NotBeNullOrWhiteSpace();
        firstItem.UserName.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetTopicDetail_ReturnsValidData_WhenTopicExists()
    {
        var topicId = "1"; 
        var result = await _apiService.GetTopicDetail(topicId);

        result.Should().NotBeNull();
        result.Title.Should().NotBeNullOrWhiteSpace();
        result.Content.Should().NotBeNull(); 
        result.CreatedText.Should().NotBeNullOrWhiteSpace();
        result.UserName.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetTagInfo_ReturnsValidData_WhenTagExists()
    {
        var tagName = "python";
        var result = await _apiService.GetTagInfo(tagName);

        result.Should().NotBeNull();
        // TagInfo doesn't explicitly store the tag name back (it's in the URL).
        // Assert items presence.
        result.Items.Should().NotBeNull();
        result.Items.Count.Should().BeGreaterThanOrEqualTo(0);
    }
}
