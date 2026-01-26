namespace V2ex.Maui2.Core;

public class LoginParametersWithCaptcha
{
    public LoginParameters Parameters { get; set; } = new();
    public string CaptchaImageBase64 { get; set; } = string.Empty;
}
