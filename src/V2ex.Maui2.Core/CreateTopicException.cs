using System;

namespace V2ex.Maui2.Core;

public class CreateTopicException : Exception
{
    public CreateTopicException(Problem problem)
    {
        this.Problem = problem;
    }

    public Problem Problem { get; }
}
