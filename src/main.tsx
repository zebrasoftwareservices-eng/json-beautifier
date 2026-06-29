import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { ConverterPage } from "./pages/ConverterPage.tsx";
import { JsonValidatorPage } from "./pages/JsonValidatorPage.tsx";
import { JsonRepairPage } from "./pages/JsonRepairPage.tsx";
import { JsonMinifierPage } from "./pages/JsonMinifierPage.tsx";

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
  </StrictMode>,
);
