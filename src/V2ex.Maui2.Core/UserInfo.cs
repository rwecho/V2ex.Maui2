using HtmlAgilityPack;
using System.Diagnostics;

namespace V2ex.Maui2.Core;

[HasXPath]
[DebuggerDisplay("{Name}")]
public class UserInfo
{
    [XPath("//div[@id='Rightbar']/div[@class='box'][1]//img[@class='avatar']", "alt")]
    [SkipNodeNotFound]
    public string? Name { get; init; }

    [XPath("//div[@id='Rightbar']/div[@class='box'][1]//img[@class='avatar']", "src")]
    [SkipNodeNotFound]
    public string? Avatar { get; init; }


    [XPath("//div[@id='Rightbar']/div[@class='box'][1]//a[@href='/notifications']")]
    [SkipNodeNotFound]
    public string? Notifications { get; set; }

    [XPath("//div[@id='money']//img[@alt='G']/preceding-sibling::text()[1]")]
    [SkipNodeNotFound]
    public string? MoneyGold { get; set; }

    [XPath("//div[@id='money']//img[@alt='S']/preceding-sibling::text()[1]")]
    [SkipNodeNotFound]
    public string? MoneySilver { get; set; }

    [XPath("//div[@id='money']//img[@alt='B']/preceding-sibling::text()[1]")]
    [SkipNodeNotFound]
    public string? MoneyBronze { get; set; }

    [XPath("//div[@id='Rightbar']/div[@class='box'][1]//a[@href='/mission/daily']", "href")]
    [SkipNodeNotFound]
    public string? DailyMission { get; set; }
}
