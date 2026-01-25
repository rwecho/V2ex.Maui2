using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace V2ex.Maui2.Api.Services;

public class V2exJsonService
{
    private readonly ILogger<V2exJsonService> _logger;

    public V2exJsonService(ILogger<V2exJsonService> logger)
    {
        _logger = logger;
    }

    public async Task<List<Models.V2exTopic>> GetNodeTopicsAsync(string nodeName, int page)
    {
        _logger.LogInformation("Fetching topics for node: {NodeName}, page: {Page}", nodeName, page);

        // TODO: 实现实际的逻辑，这里返回空列表
        await Task.Delay(10);

        return new List<Models.V2exTopic>();
    }
}