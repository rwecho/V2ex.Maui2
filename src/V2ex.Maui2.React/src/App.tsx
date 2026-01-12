import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { App as KonstaApp } from "konsta/react";
import { HomePage } from "./pages/HomePage";
import { TopicDetailPage } from "./pages/TopicDetailPage";

function App() {
  return (
    // Konsta's default `safeAreas` adds top padding to avoid the iPhone notch.
    // In a MAUI HybridWebView this can look like an extra “white gap” because
    // the native host already deals with safe areas.
    <KonstaApp theme="ios" safeAreas={false}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:topicId" element={<TopicDetailPage />} />
        </Routes>
      </Router>
    </KonstaApp>
  );
}

export default App;
