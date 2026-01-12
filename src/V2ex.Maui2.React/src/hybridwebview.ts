declare global {
  interface Window {
    HybridWebView: any;
    chrome: any;
    webkit: any;
  }
}

window.HybridWebView = {
  Init: () => {
    function DispatchHybridWebViewMessage(message: any) {
      const event = new CustomEvent("HybridWebViewMessageReceived", {
        detail: { message: message },
      });
      window.dispatchEvent(event);
    }
    if (window.chrome && window.chrome.webview) {
      // Windows WebView2
      window.chrome.webview.addEventListener("message", (arg: any) => {
        DispatchHybridWebViewMessage(arg.data);
      });
    } else if (
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.webwindowinterop
    ) {
      // iOS and MacCatalyst WKWebView
      window.external = {
        receiveMessage: (message: any) => {
          DispatchHybridWebViewMessage(message);
        },
      } as any;
    } else {
      // Android WebView
      window.addEventListener("message", (arg) => {
        DispatchHybridWebViewMessage(arg.data);
      });
    }
  },

  SendRawMessage: function SendRawMessage(message: any) {
    window.HybridWebView.__SendMessageInternal("__RawMessage", message);
  },
  InvokeDotNet: async function InvokeDotNetAsync(
    methodName: any,
    paramValues: any
  ) {
    const body = {
      MethodName: methodName,
    } as any;

    if (typeof paramValues !== "undefined") {
      if (!Array.isArray(paramValues)) {
        paramValues = [paramValues];
      }

      for (var i = 0; i < paramValues.length; i++) {
        paramValues[i] = JSON.stringify(paramValues[i]);
      }

      if (paramValues.length > 0) {
        body.ParamValues = paramValues;
      }
    }

    const message = JSON.stringify(body);

    var requestUrl = `${
      window.location.origin
    }/__hwvInvokeDotNet?data=${encodeURIComponent(message)}`;

    const rawResponse = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const response = await rawResponse.json();

    if (response) {
      if (response.IsJson) {
        return JSON.parse(response.Result);
      }

      return response.Result;
    }

    return null;
  },

  __SendMessageInternal: function __SendMessageInternal(
    type: any,
    message: any
  ) {
    const messageToSend = type + "|" + message;

    if (window.chrome && window.chrome.webview) {
      // Windows WebView2
      window.chrome.webview.postMessage(messageToSend);
    } else if (
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.webwindowinterop
    ) {
      // iOS and MacCatalyst WKWebView
      window.webkit.messageHandlers.webwindowinterop.postMessage(messageToSend);
    } else {
      // Android WebView
      let hybridWebViewHost: any;

      hybridWebViewHost.sendMessage(messageToSend);
    }
  },

  __InvokeJavaScript: function __InvokeJavaScript(
    taskId: any,
    methodName: any,
    args: any
  ) {
    if (methodName[Symbol.toStringTag] === "AsyncFunction") {
      // For async methods, we need to call the method and then trigger the callback when it's done
      const asyncPromise = methodName(...args);
      asyncPromise
        .then((asyncResult: any) => {
          window.HybridWebView.__TriggerAsyncCallback(taskId, asyncResult);
        })
        .catch((error: any) => console.error(error));
    } else {
      // For sync methods, we can call the method and trigger the callback immediately
      const syncResult = methodName(...args);
      window.HybridWebView.__TriggerAsyncCallback(taskId, syncResult);
    }
  },

  __TriggerAsyncCallback: function __TriggerAsyncCallback(
    taskId: any,
    result: any
  ) {
    // Make sure the result is a string
    if (result && typeof result !== "string") {
      result = JSON.stringify(result);
    }

    window.HybridWebView.__SendMessageInternal(
      "__InvokeJavaScriptCompleted",
      taskId + "|" + result
    );
  },
};
window.HybridWebView.Init();
