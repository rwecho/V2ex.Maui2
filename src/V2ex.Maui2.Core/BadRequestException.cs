using System;

namespace V2ex.Maui2.Core;

public class BadRequestException : Exception
{
    public BadRequestException(string message) : base($"Bad Request: {message}")
    {

    }
}
