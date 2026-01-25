using Microsoft.AspNetCore.Mvc;
using V2ex.Maui2.Core;

namespace V2ex.Maui2.Api.Controllers;

[ApiController]
[Route("api/v2ex/nodes")]
public class NodesController : ControllerBase
{
    private readonly ILogger<NodesController> _logger;
    private readonly ApiService _apiService;

    public NodesController(ILogger<NodesController> logger, ApiService apiService)
    {
        _logger = logger;
        _apiService = apiService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _apiService.GetNodesInfo();
        return Ok(result);
    }

    [HttpGet("{name}")]
    public async Task<IActionResult> GetNode([FromRoute] string name)
    {
        var result = await _apiService.GetNodeInfo(name);
        return Ok(result);
    }

    [HttpGet("{name}/topics")]
    public async Task<IActionResult> GetNodeTopics([FromRoute] string name, [FromQuery] int page = 1)
    {
        var result = await _apiService.GetNodePageInfo(name, page);
        return Ok(result);
    }

    [HttpPost("{id}/ignore")]
    public async Task<IActionResult> IgnoreNode(string id, [FromQuery] string once)
    {
        var result = await _apiService.IgnoreNode(id, once);
        return Ok(result);
    }

    [HttpPost("{id}/unignore")]
    public async Task<IActionResult> UnignoreNode(string id, [FromQuery] string once)
    {
        var result = await _apiService.UnignoreNode(id, once);
        return Ok(result);
    }
}
