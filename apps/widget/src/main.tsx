import React from "react";
import { createRoot } from "react-dom/client";
import { Widget } from "./Widget";

/**
 * Ponto de entrada do widget embebível.
 * Procura o elemento <div id="clinicabot-widget" data-clinic="SLUG"> na página
 * e monta o React widget dentro dele.
 */
function init() {
  const container = document.getElementById("clinicabot-widget");
  if (!container) {
    console.warn("[ClinicaBot] Elemento #clinicabot-widget não encontrado.");
    return;
  }

  const clinicSlug = container.dataset.clinic;
  if (!clinicSlug) {
    console.warn("[ClinicaBot] Atributo data-clinic não definido.");
    return;
  }

  const apiUrl = (
    container.dataset.apiUrl ||
    (window as Window & { CLINICABOT_API_URL?: string }).CLINICABOT_API_URL ||
    (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
    window.location.origin
  ).replace(/\/$/, "");

  console.log("[ClinicaBot] apiUrl:", apiUrl, "clinicSlug:", clinicSlug);

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Widget clinicSlug={clinicSlug} apiUrl={apiUrl} />
    </React.StrictMode>
  );
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
