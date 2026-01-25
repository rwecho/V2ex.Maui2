using System;
using System.Diagnostics;

namespace V2ex.Maui2.Core.Utilities;

public readonly struct ValueStopwatch
{
    private readonly long _startTimestamp;

    private ValueStopwatch(long startTimestamp)
    {
        _startTimestamp = startTimestamp;
    }

    public static ValueStopwatch StartNew()
    {
        return new ValueStopwatch(GetTimestamp());
    }

    public TimeSpan Elapsed => GetElapsedTime(_startTimestamp, GetTimestamp());

    public long ElapsedMilliseconds => (long)Elapsed.TotalMilliseconds;

    public static long GetTimestamp()
    {
        return Stopwatch.GetTimestamp();
    }

    public static TimeSpan GetElapsedTime(long startTimestamp, long endTimestamp)
    {
        var timestampDelta = endTimestamp - startTimestamp;
        var timestampDeltaTicks = timestampDelta * (10_000_000 / Stopwatch.Frequency);
        return new TimeSpan(timestampDeltaTicks);
    }

    public override string ToString()
    {
        return Elapsed.ToString();
    }
}