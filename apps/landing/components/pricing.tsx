const plans = [
  {
    name: "PILOT",
    price: "Gratuito",
    period: "30 dias",
    description: "Para testar com a sua clínica real, sem riscos.",
    features: [
      "Até 50 marcações/mês",
      "1 utilizador",
      "Chatbot com IA",
      "Widget embebível",
      "Suporte por email",
    ],
    cta: "Começar grátis",
    ctaHref: "#contact",
    highlighted: false,
    badge: null,
  },
  {
    name: "STARTER",
    price: "€149",
    period: "/mês",
    description: "Para clínicas que querem crescer com mais recursos.",
    features: [
      "Até 200 marcações/mês",
      "3 utilizadores",
      "Tudo do Pilot",
      "Relatórios e estatísticas",
      "Lembretes por email",
      "Suporte prioritário",
    ],
    cta: "Escolher Starter",
    ctaHref: "#contact",
    highlighted: true,
    badge: "Popular",
  },
  {
    name: "CLINIC",
    price: "€299",
    period: "/mês",
    description: "Para policlínicas com múltiplas especialidades e equipa.",
    features: [
      "Marcações ilimitadas",
      "Utilizadores ilimitados",
      "Tudo do Starter",
      "Personalização completa",
      "API dedicada",
      "Gestor de conta",
    ],
    cta: "Contactar vendas",
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
            Sem surpresas. Sem compromisso. Cancele quando quiser.
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
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    plan.highlighted ? "text-emerald-200" : "text-[#1D9E75]"
                  }`}
                >
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span
                    className={`mb-1 text-sm ${
                      plan.highlighted ? "text-emerald-200" : "text-gray-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm ${
                    plan.highlighted ? "text-emerald-100" : "text-gray-500"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={`mt-0.5 flex-shrink-0 text-base leading-none ${
                        plan.highlighted ? "text-emerald-200" : "text-[#1D9E75]"
                      }`}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
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
          Precisa de algo mais?{" "}
          <a href="#contact" className="text-[#1D9E75] underline hover:text-[#15745a]">
            Fale connosco
          </a>{" "}
          sobre o plano Enterprise.
        </p>
      </div>
    </section>
  );
}
