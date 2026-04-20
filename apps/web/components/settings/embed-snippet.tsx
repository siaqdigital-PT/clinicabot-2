"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function EmbedSnippet({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL ?? "https://cdn.clinicabot.pt/widget/latest/bundle.js";
  const snippet = `<!-- ClinicaBot Widget -->
<div id="clinicabot-widget" data-clinic="${slug}"></div>
<script src="${widgetUrl}/bundle.js" async></script>`;

  function copySnippet() {
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-gray-900">Incorporar no seu site</h3>
      <p className="mb-4 text-xs text-gray-500">
        Cole este código antes do <code className="font-mono">&lt;/body&gt;</code> no seu website.
      </p>

      <div className="relative">
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
          <code>{snippet}</code>
        </pre>
        <button
          onClick={copySnippet}
          className="absolute right-3 top-3 rounded-md bg-gray-700 p-1.5 text-gray-300 transition-colors hover:bg-gray-600"
          title="Copiar código"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        O widget carrega automaticamente com as cores e configurações da sua clínica.
      </p>
    </div>
  );
}
