namespace V2ex.Maui2.Core;

public class UnitInfo
{
    public string Url { get; internal set; } = null!;

    internal static UnitInfo Parse(string html)
    {
        return new UnitInfo();
    }
}
