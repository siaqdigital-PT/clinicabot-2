"use client";

import Link from "next/link";
import { CheckCircle, Circle, Settings, Stethoscope, Users, MessageSquare, Code } from "lucide-react";
import { useState } from "react";

interface OnboardingSteps {
  hasClinicInfo: boolean;
  hasSpecialties: boolean;
  hasDoctors: boolean;
  hasWelcomeMessage: boolean;
}

interface OnboardingGuideProps {
  steps: OnboardingSteps;
  clinicSlug: string;
}

export function OnboardingGuide({ steps, clinicSlug }: OnboardingGuideProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const allSteps = [
    {
      id: "clinic-info",
      title: "Completar informações da clínica",
      description: "Adicione morada, telefone e email da clínica.",
      done: steps.hasClinicInfo,
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      id: "specialties",
      title: "Adicionar especialidades",
      description: "Crie as especialidades médicas disponíveis na clínica.",
      done: steps.hasSpecialties,
      href: "/dashboard/specialties",
      icon: Users,
    },
    {
      id: "doctors",
      title: "Adicionar médicos",
      description: "Registe os médicos e os seus horários de disponibilidade.",
      done: steps.hasDoctors,
      href: "/dashboard/doctors",
      icon: Stethoscope,
    },
    {
      id: "chatbot",
      title: "Personalizar o chatbot",
      description: "Configure a mensagem de boas-vindas, horários e preços.",
      done: steps.hasWelcomeMessage,
      href: "/dashboard/settings",
      icon: MessageSquare,
    },
    {
      id: "widget",
      title: "Instalar o widget no site",
      description: "Copie o código e cole no seu website para ativar o chatbot.",
      done: false,
      href: "/dashboard/settings#embed",
      icon: Code,
    },
  ];

  const completedCount = allSteps.filter((s) => s.done).length;
  const totalCount = allSteps.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  if (completedCount === totalCount) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Configuração inicial da clínica
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Complete os passos abaixo para ativar o chatbot na sua clínica.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Dispensar
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>{completedCount} de {totalCount} passos concluídos</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200">
          <div
            className="h-2 rounded-full bg-[#1D9E75] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Lista de passos */}
      <div className="space-y-2">
        {allSteps.map((step) => (
          <Link
            key={step.id}
            href={step.done ? "#" : step.href}
            className={`flex items-center gap-4 rounded-lg p-3 transition-colors ${
              step.done
                ? "cursor-default opacity-60"
                : "bg-white hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex-shrink-0">
              {step.done ? (
                <CheckCircle size={20} className="text-emerald-500" />
              ) : (
                <Circle size={20} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400">{step.description}</p>
            </div>
            {!step.done && (
              <div className="flex-shrink-0">
                <step.icon size={16} className="text-gray-400" />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Snippet de embed */}
      <div className="mt-4 rounded-lg bg-gray-900 p-3">
        <p className="mb-1.5 text-xs text-gray-400">Código para instalar no seu site:</p>
        <code className="text-xs text-emerald-400 break-all">
          {`<div id="clinicabot-widget" data-clinic="${clinicSlug}"></div>`}<br />
          {`<script src="https://clinicabot.vercel.app/widget/bundle.js" async></script>`}
        </code>
      </div>
    </div>
  );
}
