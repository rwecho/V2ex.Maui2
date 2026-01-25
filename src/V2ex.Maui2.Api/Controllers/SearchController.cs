using Microsoft.AspNetCore.Mvc;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
[Route("api/v2ex/search")]
public class SearchController : ControllerBase
{
    private readonly ILogger<SearchController> _logger;
    private readonly ApiService _apiService;

    public SearchController(ILogger<SearchController> logger, ApiService apiService)
    {
        _logger = logger;
        _apiService = apiService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int from = 0, [FromQuery] string sort = "created")
    {
        var result = await _apiService.Search(q, from, sort);
        return Ok(result);
    }
}
