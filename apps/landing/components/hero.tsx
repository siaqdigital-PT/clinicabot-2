export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0fdf8] to-white py-24">
      {/* Decoração de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#1D9E75]/8 blur-3xl" />
        <div className="absolute top-20 -left-20 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1D9E75]/30 bg-[#1D9E75]/10 px-4 py-1.5 text-sm font-medium text-[#1D9E75]">
          <span className="h-2 w-2 rounded-full bg-[#1D9E75] animate-pulse" />
          Chatbot com IA · 100% em português
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
          A sua clínica não dorme.{" "}
          <span className="text-[#1D9E75]">O seu assistente também não.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500">
          Chatbot inteligente que marca consultas 24/7, reduz faltas e captura marcações que se
          perdem fora do horário.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#contact"
            className="rounded-xl bg-[#1D9E75] px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-[#15745a] transition-colors"
          >
            Começar piloto gratuito
          </a>
          <a
            href="#demo"
            className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ver demonstração →
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-gray-400">
          Sem compromisso · Instalação em 30 minutos · Suporte em português
        </p>

        {/* Mock screenshot */}
        <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 shadow-2xl">
          <div className="h-8 bg-gray-100 flex items-center gap-2 px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <div className="mx-auto w-64 rounded bg-white px-3 py-0.5 text-xs text-gray-400">
              clinicabot.pt/dashboard
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-white p-8">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Marcações hoje", value: "12", color: "bg-blue-100 text-blue-600" },
                { label: "Esta semana", value: "67", color: "bg-green-100 text-green-600" },
                { label: "Taxa ocupação", value: "87%", color: "bg-purple-100 text-purple-600" },
                { label: "Conversão chat", value: "64%", color: "bg-orange-100 text-orange-600" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-400">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold rounded-lg inline-block px-2 py-0.5 ${card.color}`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
