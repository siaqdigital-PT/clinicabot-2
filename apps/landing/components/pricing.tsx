const plans = [
  {
    name: "DEMONSTRAÇÃO",
    price: "Gratuito",
    period: "30 dias",
    description: "Experimente o ClinicaBot na sua clínica sem qualquer compromisso.",
    features: [
      "Acesso completo a todas as funcionalidades",
      "Chatbot IA com marcações automáticas",
      "Widget embebível no seu site",
      "Dashboard completo de gestão",
      "Suporte por email durante o período",
    ],
    cta: "Pedir demonstração",
    ctaHref: "#contact",
    highlighted: false,
    badge: null,
  },
  {
    name: "LICENÇA",
    price: "€2.500",
    period: "pagamento único",
    description: "Licença perpétua para a sua clínica. Setup incluído.",
    features: [
      "Licença vitalícia para 1 clínica",
      "Setup e configuração incluídos",
      "Utilizadores ilimitados",
      "Marcações ilimitadas",
      "Chatbot IA personalizado",
      "Widget embebível no seu site",
      "Dashboard completo de gestão",
      "Relatórios e estatísticas",
      "3 meses de suporte incluídos",
    ],
    cta: "Adquirir licença",
    ctaHref: "#contact",
    highlighted: true,
    badge: "Mais popular",
  },
  {
    name: "MANUTENÇÃO",
    price: "€500",
    period: "/ano",
    description: "Suporte contínuo e atualizações para a sua clínica.",
    features: [
      "Atualizações de software",
      "Suporte técnico prioritário",
      "Monitorização do sistema",
      "Backups regulares",
      "Novas funcionalidades incluídas",
      "Assistência remota quando necessário",
    ],
    cta: "Saber mais",
    ctaHref: "#contact",
    highlighted: false,
    badge: null,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Preços simples e transparentes</h2>
          <p className="mt-4 text-lg text-gray-500">
            Sem mensalidades. Pague uma vez e use para sempre.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-[#1D9E75] text-white shadow-2xl md:scale-105"
                  : "border border-gray-200 bg-white shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-yellow-400 px-4 py-1 text-xs font-bold text-yellow-900">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Cabeçalho */}
              <div className="mb-6">
                <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? "text-emerald-200" : "text-[#1D9E75]"}`}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`mb-1 text-sm ${plan.highlighted ? "text-emerald-200" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${plan.highlighted ? "text-emerald-100" : "text-gray-500"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 flex-shrink-0 text-base leading-none ${plan.highlighted ? "text-emerald-200" : "text-[#1D9E75]"}`}>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              
                href={plan.ctaHref}
                className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-white text-[#1D9E75] hover:bg-emerald-50"
                    : "bg-[#1D9E75] text-white hover:bg-[#15745a]"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-400">
          Tem uma rede de clínicas?{" "}
          <a href="#contact" className="text-[#1D9E75] underline hover:text-[#15745a]">
            Fale connosco
          </a>{" "}
          para condições especiais.
        </p>
      </div>
    </section>
  );
}