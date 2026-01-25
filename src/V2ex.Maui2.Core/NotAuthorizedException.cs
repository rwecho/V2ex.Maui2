using System;

namespace V2ex.Maui2.Core;

public class NotAuthorizedException : Exception
{
    public NotAuthorizedException() : base("Not Authorized")
    {

    }
}
