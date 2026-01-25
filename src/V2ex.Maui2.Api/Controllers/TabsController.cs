using Microsoft.AspNetCore.Mvc;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
[Route("api/v2ex/tabs")]
public class TabsController : ControllerBase
{
    private readonly ILogger<TabsController> _logger;
    private readonly ApiService _apiService;

    public TabsController(ILogger<TabsController> logger, ApiService apiService)
    {
        _logger = logger;
        _apiService = apiService;
    }

    [HttpGet("{tab}")]
    public async Task<IActionResult> GetTabTopics([FromRoute] string tab)
    {
        var result = await _apiService.GetTabTopics(tab);
        return Ok(result);
    }
}
