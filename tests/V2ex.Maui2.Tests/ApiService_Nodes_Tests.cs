using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using V2ex.Maui2.Core;
using V2ex.Maui2.Core.Constants;
using Xunit;

namespace V2ex.Maui2.Tests;

public class ApiService_Nodes_Tests
{
    private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
    private readonly Mock<ILogger<ApiService>> _mockLogger;
    private readonly ApiService _apiService;

    public ApiService_Nodes_Tests()
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
    public async Task GetNodeInfo_ReturnsValidData_WhenNodeExists()
    {
        var nodeName = "python";
        var result = await _apiService.GetNodeInfo(nodeName);

        result.Should().NotBeNull();
        result!.Name.Should().Be(nodeName);
        result.Title.Should().NotBeNullOrWhiteSpace();
        result.Topics.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetNodesInfo2_ReturnsValidData_WhenCalled()
    {
        var result = await _apiService.GetNodesInfo2();

        result.Should().NotBeNull();
        result!.Count.Should().BeGreaterThan(0);
        
        var firstNode = result[0];
        firstNode.Name.Should().NotBeNullOrWhiteSpace();
        firstNode.Title.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetNodesNavInfo_ReturnsValidData_WhenCalled()
    {
        var result = await _apiService.GetNodesNavInfo();

        result.Should().NotBeNull();
        result.Items.Should().NotBeNull();
        result.Items.Should().NotBeEmpty();

        var firstCategory = result.Items[0];
        firstCategory.Category.Should().NotBeNullOrWhiteSpace(); // Field is Category
        firstCategory.Nodes.Should().NotBeNull();
        firstCategory.Nodes.Should().NotBeEmpty();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task GetNodePageInfo_ReturnsValidData_WhenNodeExists()
    {
        var nodeName = "python";
        var result = await _apiService.GetNodePageInfo(nodeName);

        result.Should().NotBeNull();
        // NodePageInfo doesn't expose NodeName or TopicCount directly in the model provided.
        // It exposes Items.
        result!.Items.Should().NotBeNull();
        
        if (result.Items.Count > 0)
        {
            var firstTopic = result.Items[0];
            firstTopic.UserName.Should().NotBeNullOrWhiteSpace();
            firstTopic.TopicTitle.Should().NotBeNullOrWhiteSpace();
        }
    }
}
