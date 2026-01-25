namespace V2ex.Maui2.Core.Constants;

public static class ApiConstants
{
    public const string BaseUrl = "https://www.v2ex.com";
    public const string BaseDomain = "www.v2ex.com";
    public const string SearchUrl = "https://www.sov2ex.com/api/search";
    
    public const string ContentTypeFormUrlEncoded = "application/x-www-form-urlencoded";
    public const string ContentTypeJson = "application/json";
    
    public const string HeaderReferer = "Referer";
    public const string HeaderUserAgent = "User-Agent";
    public const string HeaderContentType = "Content-Type";
    public const string HeaderAccept = "Accept";
    
    public const string LoginPath = "/signin";
    public const string LoginNextPath = "/?next=/";
    public const string LoginPathWithNext = "/signin?next=/";
    public const string MissionDailyPath = "/mission/daily";
    public const string TwoFaPath = "/2fa?next=/mission/daily";
    public const string RecentPath = "/recent";
    
    public const string SyntaxDefault = "default";
    public const string ParameterNext = "next";
    public const string ParameterOnce = "once";
    public const string ParameterTitle = "title";
    public const string ParameterContent = "content";
    public const string ParameterNodeName = "node_name";
    public const string ParameterCode = "code";
    public const string ValueNextSlash = "/";
    
    public const string ErrorMessageCannotReply = "Can not reply the topic.";
    public const string ErrorMessageCannotAction = "Cannot perform action.";
    
    public static class RedirectMessage
    {
        public const string CancelFavorite = "取消收藏";
        public const string ThankSent = "感谢已发送";
        public const string CancelIgnore = "取消忽略";
    }
    
    public static class HttpStatusCodes
    {
        public const int Unauthorized = 401;
        public const int Forbidden = 403;
        public const int NotFound = 404;
        public const int BadRequest = 400;
    }
}