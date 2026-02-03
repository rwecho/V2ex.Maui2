#if IOS
using Microsoft.Maui.Handlers;
using WebKit;
using V2ex.Maui2.App.Platforms.iOS;
using Microsoft.Maui.Controls;
using UIKit;

namespace V2ex.Maui2.App.Platforms.iOS
{
    public partial class CustomHybridWebViewHandler : HybridWebViewHandler
    {
        protected override WKWebView CreatePlatformView()
        {
            // IMPORTANT:
            // Keep the exact WKWebView instance created by the base handler.
            // HybridWebViewHandler may cache/use that instance for JS invoke/bridge wiring.
            return base.CreatePlatformView();
        }

        protected override void ConnectHandler(WKWebView platformView)
        {
            base.ConnectHandler(platformView);

            // Hide the keyboard accessory bar (Undo/Redo/Paste/Prev/Next style bar) without swapping WKWebView.
            // This avoids breaking the HybridWebView JS bridge.
            try
            {
                platformView.InputAssistantItem.LeadingBarButtonGroups = Array.Empty<UIBarButtonItemGroup>();
                platformView.InputAssistantItem.TrailingBarButtonGroups = Array.Empty<UIBarButtonItemGroup>();
            }
            catch
            {
                // Best-effort: if iOS changes behavior, we still want the WebView to function.
            }
        }
    }
}
#endif
