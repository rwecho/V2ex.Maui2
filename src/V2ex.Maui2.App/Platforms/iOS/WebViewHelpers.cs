using System;
using System.Runtime.InteropServices;
using Foundation;
using ObjCRuntime;
using UIKit;
using WebKit;

namespace V2ex.Maui2.App.Platforms.iOS
{
    public static class WebViewHelpers
    {
        delegate IntPtr IntPtrDelegate(IntPtr block, IntPtr self);
        delegate void VoidDelegate(IntPtr block, IntPtr self);

        public static void RemoveInputAccessoryView(WKWebView webView)
        {
            var wkContentView = FindWKContentView(webView);
            if (wkContentView == null) return;

            // Define a customized class name to avoid conflict
            var newClassName = $"NoInputAccessoryView_{wkContentView.Class.Name}";
            var newClass = Class.GetHandle(newClassName);

            if (newClass == IntPtr.Zero)
            {
                // Create a new class dynamically that inherits from the original class
                newClass = Common.ObjcAllocateClassPair(wkContentView.Class.Handle, newClassName, 0);
                
                // Override inputAccessoryView to return nil
                var method = Common.class_getInstanceMethod(newClass, Selector.GetHandle("inputAccessoryView"));
                
                // Define the implementation block that returns IntPtr.Zero
                // Using a simple delegate that returns IntPtr.Zero (nil)
                // Note: In C#, this requires P/Invoke setup or using BlockLiteral.
                // A simpler way often used in Xamarin/MAUI is swizzling with `class_addMethod`.
                
                // Add the method - it takes (id self, SEL _cmd) and returns id (view)
                Common.class_addMethod(newClass, Selector.GetHandle("inputAccessoryView"), new System.Func<IntPtr, IntPtr, IntPtr>(InputAccessoryViewGetter), "@@:");
                
                Common.ObjcRegisterClassPair(newClass);
            }

            // Swizzle the class of the instance to our new class
            Common.object_setClass(wkContentView.Handle, newClass);
        }

        [MonoPInvokeCallback(typeof(Func<IntPtr, IntPtr, IntPtr>))]
        static IntPtr InputAccessoryViewGetter(IntPtr self, IntPtr cmd)
        {
            return IntPtr.Zero;
        }

        static UIView? FindWKContentView(UIView view)
        {
            if (view.GetType().Name.Contains("WKContentView"))
                return view;

            foreach (var subview in view.Subviews)
            {
                var found = FindWKContentView(subview);
                if (found != null) return found;
            }
            return null;
        }

        // Internal native definitions
        static class Common
        {
            [DllImport("/usr/lib/libobjc.dylib", EntryPoint = "objc_allocateClassPair")]
            public static extern IntPtr ObjcAllocateClassPair(IntPtr superclass, string name, int extraBytes);

            [DllImport("/usr/lib/libobjc.dylib", EntryPoint = "objc_registerClassPair")]
            public static extern void ObjcRegisterClassPair(IntPtr cls);

            [DllImport("/usr/lib/libobjc.dylib", EntryPoint = "class_addMethod")]
            public static extern bool class_addMethod(IntPtr cls, IntPtr name, Delegate imp, string types);

            [DllImport("/usr/lib/libobjc.dylib", EntryPoint = "object_setClass")]
            public static extern IntPtr object_setClass(IntPtr obj, IntPtr cls);
            
            [DllImport("/usr/lib/libobjc.dylib", EntryPoint = "class_getInstanceMethod")]
            public static extern IntPtr class_getInstanceMethod(IntPtr cls, IntPtr name);
        }
    }
}
