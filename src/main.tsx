import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { ConverterPage } from "./pages/ConverterPage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<App />} />
        <Route path="/json-to-yaml" element={<ConverterPage format="yaml" />} />
        <Route path="/json-to-csv" element={<ConverterPage format="csv" />} />
        <Route path="/json-to-xml" element={<ConverterPage format="xml" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
