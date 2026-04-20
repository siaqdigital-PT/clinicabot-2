"use client";

import { useEffect } from "react";

export default function DemoSection() {
  useEffect(() => {
    if (document.getElementById("clinicabot-script")) return;

    const script = document.createElement("script");
    script.id = "clinicabot-script";
    script.src = "https://clinicabot.vercel.app/widget/bundle.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <section id="demo" className="py-20 bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Experimente agora</h2>
        <p className="text-gray-400 mb-8 text-lg">
          Teste o nosso chatbot sem compromisso. Clique no botão verde no canto inferior direito
          para iniciar uma conversa.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-gray-400">
          <p className="text-sm">
            O chatbot da Clínica Demo aparece no canto inferior direito desta página.
          </p>
          <p className="text-sm mt-2">
            Experimente marcar uma consulta fictícia — o processo é real!
          </p>
        </div>
      </div>
      <div
        id="clinicabot-widget"
        data-clinic="demo"
        data-api-url="https://clinicabot.vercel.app"
      />
    </section>
  );
}
