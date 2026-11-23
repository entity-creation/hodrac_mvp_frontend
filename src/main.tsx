import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./vzApp/App.tsx";
import ScrollToTop from "./scroll_to_top.tsx";
import { MetaPixelPageViews } from "./utils/v2Utils/metaPixel";
import { loadImageConfig } from "./utils/v2Utils/imageHosts";

// Image hosts for the R2 → Vercel fallback; ready before most images could fail.
void loadImageConfig();

// After a deploy, a tab opened on the old version asks for page chunks that no
// longer exist. Reload once to pick up the new version (at most once a minute,
// so a real outage can't cause a reload loop).
window.addEventListener("vite:preloadError", event => {
  const KEY = "hodrac:chunk-reload";
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch { /* storage unavailable */ }
  if (Date.now() - last < 60_000) return;
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* storage unavailable */ }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <MetaPixelPageViews />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
