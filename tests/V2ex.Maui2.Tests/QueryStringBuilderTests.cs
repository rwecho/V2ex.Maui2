using System.Collections.Generic;
using FluentAssertions;
using Xunit;

namespace V2ex.Maui2.Tests;

public class QueryStringBuilderTests
{
    [Fact]
    public void Build_EmptyDictionary_ReturnsEmptyString()
    {
        // Arrange
        var parameters = new Dictionary<string, string>();

        // Act
        var result = V2ex.Maui2.Core.Utilities.QueryStringBuilder.Build(parameters);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void Build_SimpleParameters_EncodesCorrectly()
    {
        // Arrange
        var parameters = new Dictionary<string, string>
        {
            { "key1", "value1" },
            { "key2", "value2" }
        };

        // Act
        var result = V2ex.Maui2.Core.Utilities.QueryStringBuilder.Build(parameters);

        // Assert
        result.Should().Contain("key1=value1");
        result.Should().Contain("key2=value2");
    }

    [Fact]
    public void Build_SpecialCharacters_EncodesCorrectly()
    {
        // Arrange
        var parameters = new Dictionary<string, string>
        {
            { "search", "hello world" },
            { "filter", "a&b" }
        };

        // Act
        var result = V2ex.Maui2.Core.Utilities.QueryStringBuilder.Build(parameters);

        // Assert
        result.Should().Contain("search=hello+world");
        result.Should().Contain("filter=a%26b");
    }

    [Fact]
    public void Build_WithBaseUrl_CombinesCorrectly()
    {
        // Arrange
        var parameters = new Dictionary<string, string>
        {
            { "q", "test" }
        };

        // Act
        var result = V2ex.Maui2.Core.Utilities.QueryStringBuilder.Build(parameters, "https://example.com/api");

        // Assert
        result.Should().Be("https://example.com/api?q=test");
    }

    [Fact]
    public void BuildFromObject_ConvertsObjectToQueryString()
    {
        // Arrange
        var obj = new TestObject { Name = "test", Age = 25 };

        // Act
        var result = V2ex.Maui2.Core.Utilities.QueryStringBuilder.BuildFromObject(obj);

        // Assert
        result.Should().Contain("Name=test");
        result.Should().Contain("Age=25");
    }

    private class TestObject
    {
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
    }
}