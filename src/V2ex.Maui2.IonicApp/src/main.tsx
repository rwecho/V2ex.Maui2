import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 通知原生层应用已准备就绪
// HybridWebView 没有 Navigated 事件，需要通过 JS 主动通知
setTimeout(() => {
  try {
    const hwv = (window as any).HybridWebView;
    if (hwv?.SendRawMessage) {
      hwv.SendRawMessage(JSON.stringify({ type: 'appReady' }));
      console.log('[main.tsx] Sent appReady message to native layer');
    }
  } catch (e) {
    console.warn('[main.tsx] Failed to send appReady message:', e);
  }
}, 100);