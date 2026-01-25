using FluentAssertions;
using Xunit;

namespace V2ex.Maui2.Tests;

public class OnceTokenValidatorTests
{
    private readonly V2ex.Maui2.Core.Security.OnceTokenValidator _validator;

    public OnceTokenValidatorTests()
    {
        _validator = new V2ex.Maui2.Core.Security.OnceTokenValidator();
    }

    [Fact]
    public void IsValid_ValidToken_ReturnsTrue()
    {
        // Arrange
        var token = "abc123def456ghi";

        // Act
        var result = _validator.IsValid(token);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void NullToken_ReturnsFalse()
    {
        // Arrange
        string? token = null;

        // Act
        var result = _validator.IsValid(token!);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void EmptyToken_ReturnsFalse()
    {
        // Arrange
        var token = string.Empty;

        // Act
        var result = _validator.IsValid(token);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void TooShortToken_ReturnsFalse()
    {
        // Arrange
        var token = "abc12";

        // Act
        var result = _validator.IsValid(token);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void TooLongToken_ReturnsFalse()
    {
        // Arrange
        var token = new string('a', 70);

        // Act
        var result = _validator.IsValid(token);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void TokenWithSpecialCharacters_ReturnsFalse()
    {
        // Arrange
        var token = "abc@#$";

        // Act
        var result = _validator.IsValid(token);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void ValidateAndMark_ValidToken_MarksAsUsed()
    {
        // Arrange
        var token = "validtoken123";

        // Act
        _validator.ValidateAndMark(token);

        // Assert
        _validator.IsUsed(token).Should().BeTrue();
    }

    [Fact]
    public void ValidateAndMark_DuplicateToken_ThrowsException()
    {
        // Arrange
        var token = "validtoken123";
        _validator.ValidateAndMark(token);

        // Act & Assert
        var action = () => _validator.ValidateAndMark(token);
        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*already been used*");
    }

    [Fact]
    public void ValidateAndMark_InvalidToken_ThrowsArgumentException()
    {
        // Arrange
        var token = "inv@lid";

        // Act & Assert
        var action = () => _validator.ValidateAndMark(token);
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ClearHistory_RemovesAllTokens()
    {
        // Arrange
        _validator.ValidateAndMark("token1");
        _validator.ValidateAndMark("token2");

        // Act
        _validator.ClearHistory();

        // Assert
        _validator.IsUsed("token1").Should().BeFalse();
        _validator.IsUsed("token2").Should().BeFalse();
    }
}