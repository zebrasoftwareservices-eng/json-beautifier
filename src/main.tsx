import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { onCLS, onINP, onLCP } from "web-vitals";
import { initAnalytics, trackEvent } from "./analytics";
import "./index.css";

initAnalytics();
import App from "./App.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { ConverterPage } from "./pages/ConverterPage.tsx";
import { JsonValidatorPage } from "./pages/JsonValidatorPage.tsx";
import { JsonRepairPage } from "./pages/JsonRepairPage.tsx";
import { JsonMinifierPage } from "./pages/JsonMinifierPage.tsx";

// Report Core Web Vitals to GA4
function sendToGA(metric: { name: string; value: number; id: string }) {
  trackEvent("web_vitals", {
    metric_name: metric.name,
    metric_value: Math.round(metric.value),
    metric_id: metric.id,
  });
}
onCLS(sendToGA);
onINP(sendToGA);
onLCP(sendToGA);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<App />} />
          <Route path="/json-validator" element={<JsonValidatorPage />} />
          <Route path="/json-repair" element={<JsonRepairPage />} />
          <Route path="/json-minifier" element={<JsonMinifierPage />} />
          <Route
            path="/json-to-yaml"
            element={<ConverterPage format="yaml" />}
          />
          <Route path="/json-to-csv" element={<ConverterPage format="csv" />} />
          <Route path="/json-to-xml" element={<ConverterPage format="xml" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
    <SpeedInsights />
  </StrictMode>,
);
