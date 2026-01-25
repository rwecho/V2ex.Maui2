using Microsoft.AspNetCore.Mvc;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult UpstreamProblem(Exception ex)
    {
        return Problem(
            statusCode: StatusCodes.Status502BadGateway,
            title: "Upstream request failed",
            detail: ex.Message
        );
    }
}
