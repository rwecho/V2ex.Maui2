using HtmlAgilityPack;

namespace V2ex.Maui2.Core;

[HasXPath]
public class DailyInfo
{
    [XPath("//a[starts-with(@href, '/member')]", "href")]
    public string UserLink { get; init; } = null!;

    [XPath("//img[contains(@src, 'avatar/')]", "src")]
    public string Avatar { get; init; } = null!;

    [XPath("//h1")]
    public string Title { get; init; } = null!;

    [XPath("//div[contains(@class, 'cell') and contains(., '已连续')]")]
    [SkipNodeNotFound]
    public string? ContinuousLoginDay { get; init; }

    [XPath("//div[contains(@class, 'cell')]//input[@type='button']", "onclick")]
    [SkipNodeNotFound]
    public string? CheckInUrl { get; init; }

    public string Url { get; internal set; } = null!;

    [XPath("//body", ReturnType.OuterHtml)]
    [SkipNodeNotFound]
    public UserInfo? CurrentUser { get; init; }
}

