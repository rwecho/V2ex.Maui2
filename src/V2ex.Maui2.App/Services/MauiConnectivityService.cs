using V2ex.Maui2.Core;

namespace V2ex.Maui2.App.Services;

/// <summary>
/// MAUI implementation of IConnectivityService using Connectivity API.
/// </summary>
public class MauiConnectivityService : IConnectivityService
{
    public bool IsConnected => 
        Microsoft.Maui.Networking.Connectivity.Current.NetworkAccess == Microsoft.Maui.Networking.NetworkAccess.Internet;
}
