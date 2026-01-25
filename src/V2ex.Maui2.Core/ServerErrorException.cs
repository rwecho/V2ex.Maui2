using System;

namespace V2ex.Maui2.Core;

public class ServerErrorException : Exception
{
    public ServerErrorException(string message) : base($"Server Error: {message}")
    {

    }
}
