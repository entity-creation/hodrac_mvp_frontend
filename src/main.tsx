import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./vzApp/App.tsx";
import ScrollToTop from "./scroll_to_top.tsx";
import { MetaPixelPageViews } from "./utils/v2Utils/metaPixel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <MetaPixelPageViews />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
