import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createSessionCatalog } from "./infrastructure/session/create-session-catalog.ts";
import "./index.css";
import { App } from "./ui/App.tsx";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

const { catalog, backend, createPresence } = createSessionCatalog();

createRoot(root).render(
  <StrictMode>
    <App catalog={catalog} backend={backend} createPresence={createPresence} />
  </StrictMode>,
);
