namespace V2ex.Maui2.Core;

/// <summary>
/// Provides network connectivity status.
/// </summary>
public interface IConnectivityService
{
    /// <summary>
    /// Returns true if the device has network access.
    /// </summary>
    bool IsConnected { get; }
}
