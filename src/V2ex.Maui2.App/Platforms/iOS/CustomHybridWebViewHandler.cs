#if IOS
using Microsoft.Maui.Handlers;
using WebKit;
using V2ex.Maui2.App.Platforms.iOS;
using Microsoft.Maui.Controls;

namespace V2ex.Maui2.App.Platforms.iOS
{
    public partial class CustomHybridWebViewHandler : HybridWebViewHandler
    {
        // 重写创建原生视图的方法
        protected override WKWebView CreatePlatformView()
        {
            // 1. 【关键修复】先调用基类方法，获取官方默认生成的 WebView
            // 这一步会确保 HybridWebView 需要的所有 JS 脚本、UserController 都已被基类正确配置
            var defaultView = base.CreatePlatformView();

            // 2. 提取出这个“带有正确配置”的 Configuration
            var safeConfig = defaultView.Configuration;

            // 3. 使用这个包含桥接逻辑的 Config 来初始化我们的自定义 View
            // 这样既去掉了键盘条，又保留了 HybridWebView 的核心功能
            var customView = new NoInputAccessoryWebView(defaultView.Frame, safeConfig);

            return customView;
        }
    }
}
#endif
