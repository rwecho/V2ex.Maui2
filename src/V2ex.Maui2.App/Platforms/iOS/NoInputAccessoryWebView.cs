using CoreGraphics;
using Foundation;
using UIKit;
using WebKit;

namespace V2ex.Maui2.App.Platforms.iOS
{
    public class NoInputAccessoryWebView : WKWebView
    {
        // 必须提供构造函数，传递 frame 和 config
        public NoInputAccessoryWebView(CGRect frame, WKWebViewConfiguration configuration) 
            : base(frame, configuration)
        {
        }

        // 核心代码：重写 InputAccessoryView，返回 null 即可隐藏那个条
        public override UIView InputAccessoryView => null;
    }
}
