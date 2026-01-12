using Microsoft.AspNetCore.Mvc;
using Refit;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult UpstreamProblem(ApiException ex)
    {
        var upstreamStatus = (int)ex.StatusCode;

        // This API is a facade/proxy around V2EX; treat upstream failures as 502 for clients.
        var statusCode = StatusCodes.Status502BadGateway;

        var title = upstreamStatus > 0
            ? $"Upstream V2EX returned {(int)ex.StatusCode}"
            : "Upstream V2EX request failed";

        return Problem(
            statusCode: statusCode,
            title: title,
            detail: ex.Content
        );
    }
}
