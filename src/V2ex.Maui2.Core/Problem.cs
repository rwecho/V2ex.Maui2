using HtmlAgilityPack;
using System.Collections.Generic;

namespace V2ex.Maui2.Core;

[HasXPath]
public class Problem
{
    [XPath("//div[@class='problem']//li")]
    [SkipNodeNotFound]
    public List<string> Errors { get; set; } = new();

    public bool HasProblem()
    {
        return Errors.Count > 0;
    }
}
