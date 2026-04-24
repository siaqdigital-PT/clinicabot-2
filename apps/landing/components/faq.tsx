"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Como funciona o chatbot?",
    a: "O chatbot é instalado no site da clínica como um widget de chat. Os pacientes interagem com ele para marcar consultas, e o sistema verifica a disponibilidade dos médicos em tempo real. O chatbot fala português de Portugal natural e guia o paciente por todo o processo.",
  },
  {
    q: "Preciso de alterar o meu site?",
    a: "Não. Basta adicionar 2 linhas de código HTML ao seu site. Funciona com qualquer plataforma: WordPress, Wix, Squarespace, sites custom, etc. A nossa equipa trata da instalação e configuração inicial.",
  },
  {
    q: "Os pacientes precisam de criar conta?",
    a: "Não. O chatbot recolhe apenas os dados necessários para a marcação: nome, email e telefone. Sem registos, sem passwords. Os pacientes recebem a confirmação e o lembrete directamente no email.",
  },
  {
    q: "Como funciona a licença?",
    a: "Paga uma única vez 2.500 EUR e a licença é sua para sempre. Inclui setup completo, configuração personalizada e 3 meses de suporte. Após esse período, pode optar pela renovação anual de 250 EUR para manutenção e suporte contínuo.",
  },
  {
    q: "O que inclui a renovação anual de 250 EUR?",
    a: "A renovação anual inclui suporte técnico prioritário, atualizações de software, monitorização do sistema e assistência remota quando necessário. Sem renovação, o sistema continua a funcionar mas sem suporte nem atualizações.",
  },
  {
    q: "Como são geridas as marcações?",
    a: "Através do painel de gestão, onde pode ver todas as marcações, gerir médicos e horários, e acompanhar as conversas do chatbot. Recebe também uma notificação sempre que uma nova marcação é criada via chatbot.",
  },
  {
    q: "A demonstração gratuita tem compromisso?",
    a: "Não. Durante 30 dias tem acesso completo a todas as funcionalidades sem qualquer compromisso. No final decide se quer adquirir a licença. Os dados das marcações ficam sempre seus.",
  },
  {
    q: "Funciona com seguros de saúde?",
    a: "Sim. O sistema suporta todos os seguros de saúde portugueses — ADSE, Médis, Multicare, AdvanceCare, entre outros. O chatbot pergunta ao paciente se tem seguro e regista essa informação na marcação.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Perguntas frequentes</h2>
          <p className="mt-4 text-lg text-gray-500">
            Tudo o que precisa de saber antes de começar.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-gray-200">
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{faq.q}</span>
                <span className={`ml-4 flex-shrink-0 text-[#1D9E75] transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
              {open === i && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-sm leading-relaxed text-gray-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Tem mais perguntas?{" "}
          <a href="#contact" className="font-medium text-[#1D9E75] hover:underline">
            Fale connosco
          </a>
        </p>
      </div>
    </section>
  );
}