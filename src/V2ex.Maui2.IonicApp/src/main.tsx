import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");
const root = createRoot(container!);

// 发送 appReady 信号的辅助函数
const sendAppReady = () => {
  try {
    const hwv = (window as any).HybridWebView;
    console.debug("Attempting to send appReady message, hwv:", hwv);
    if (hwv?.SendRawMessage) {
      hwv.SendRawMessage(JSON.stringify({ type: "appReady" }));
      console.log("[main.tsx] Sent appReady message to native layer");
    }
  } catch (e) {
    console.warn("[main.tsx] Failed to send appReady message:", e);
  }
};

const sendAppInit = () => {
  try {
    const hwv = (window as any).HybridWebView;
    console.debug("Attempting to send appInit message, hwv:", hwv);
    if (hwv?.SendRawMessage) {
      hwv.SendRawMessage(JSON.stringify({ type: "appInit" }));
      console.log("[main.tsx] Sent appInit message to native layer");
    }
  } catch (e) {
    console.warn("[main.tsx] Failed to send appInit message:", e);
  }
};

// app init
const initDataHandler = (event: Event) => {
  const customEvent = event as CustomEvent;
  if (customEvent.detail && customEvent.detail.message) {
    const rawMessage = customEvent.detail.message;
    // 尝试解析消息
    const data =
      typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;

    // 检查是否是初始化消息
    if (data && data.type === "initData") {
      console.log("[main.tsx] Received initData from native:", data);

      // 移除监听器，避免重复处理
      window.removeEventListener(
        "HybridWebViewMessageReceived",
        initDataHandler,
      );

      // 渲染应用并传入数据
      renderApp(data.payload);
      (window as any).initData = data.payload;

      // 告诉原生层应用已准备就绪（可以隐藏 Slash Screen 了）
      sendAppReady();
    }
  }
};

// 注册监听器
window.addEventListener("HybridWebViewMessageReceived", initDataHandler);

// 发送 appInit 消息，告诉原生层我们准备好接收初始化数据了
sendAppInit();

// 定义渲染应用的方法
const renderApp = (initialData?: any) => {
  root.render(
    <React.StrictMode>
      <App initialData={initialData} />
    </React.StrictMode>,
  );
};
