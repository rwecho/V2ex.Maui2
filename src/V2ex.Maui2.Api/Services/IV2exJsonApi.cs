using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace V2ex.Maui2.Api.Services;

public interface IV2exJsonApi
{
    Task<List<Models.V2exNodeInfo>> GetAllNodesAsync();
    Task<Models.V2exNodeInfo> GetNodeInfoAsync(string nodeName);
    Task<List<Models.V2exTopic>> GetLatestTopicsAsync();
    Task<List<Models.V2exTopic>> GetNodeTopicsAsync(string nodeName, int page);
    Task<Models.V2exTopicDetail> GetTopicDetailAsync(int topicId);
    Task<Models.V2exMember> GetMemberInfoAsync(string username);
    Task<List<Models.V2exReply>> GetRepliesAsync(int topicId);
}

public interface IV2exJsonService
{
    Task<List<Models.V2exTopic>> GetNodeTopicsAsync(string nodeName, int page);
}

public class ApiException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string? Content { get; set; }

    public ApiException(HttpStatusCode statusCode, string? content = null) : base(content ?? statusCode.ToString())
    {
        StatusCode = statusCode;
        Content = content;
    }
}