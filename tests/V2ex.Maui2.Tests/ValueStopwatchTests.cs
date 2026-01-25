using FluentAssertions;
using System.Threading.Tasks;
using Xunit;

namespace V2ex.Maui2.Tests;

public class ValueStopwatchTests
{
    [Fact]
    public void StartNew_ReturnsRunningStopwatch()
    {
        // Act
        var sw = V2ex.Maui2.Core.Utilities.ValueStopwatch.StartNew();

        // Assert
        Task.Delay(10).GetAwaiter().GetResult();
        sw.ElapsedMilliseconds.Should().BeGreaterOrEqualTo(8);
        sw.ElapsedMilliseconds.Should().BeLessThan(1000);
    }

    [Fact]
    public void Elapsed_ReturnsCorrectTimeSpan()
    {
        // Arrange
        var sw = V2ex.Maui2.Core.Utilities.ValueStopwatch.StartNew();

        // Act
        Task.Delay(50).GetAwaiter().GetResult();
        var elapsed = sw.Elapsed;

        // Assert
        elapsed.TotalMilliseconds.Should().BeGreaterOrEqualTo(40);
        elapsed.TotalMilliseconds.Should().BeLessThan(200);
    }

    [Fact]
    public void GetTimestamp_ReturnsValidTimestamp()
    {
        // Act
        var timestamp = V2ex.Maui2.Core.Utilities.ValueStopwatch.GetTimestamp();

        // Assert
        timestamp.Should().BeGreaterThan(0);
    }

    [Fact]
    public void GetElapsedTime_ReturnsCorrectTimeSpan()
    {
        // Arrange
        var start = V2ex.Maui2.Core.Utilities.ValueStopwatch.GetTimestamp();
        Task.Delay(20).GetAwaiter().GetResult();
        var end = V2ex.Maui2.Core.Utilities.ValueStopwatch.GetTimestamp();

        // Act
        var elapsed = V2ex.Maui2.Core.Utilities.ValueStopwatch.GetElapsedTime(start, end);

        // Assert
        elapsed.TotalMilliseconds.Should().BeGreaterOrEqualTo(13);
        elapsed.TotalMilliseconds.Should().BeLessThan(100);
    }

    [Fact]
    public void ToString_ReturnsFormattedString()
    {
        // Arrange
        var sw = V2ex.Maui2.Core.Utilities.ValueStopwatch.StartNew();
        Task.Delay(10).GetAwaiter().GetResult();

        // Act
        var result = sw.ToString();

        // Assert
        result.Should().NotBeNullOrEmpty();
    }
}