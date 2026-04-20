"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const settingsSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  welcomeMessage: z.string().min(5).max(300),
  chatbotPersonality: z.enum(["professional", "friendly", "formal"]),
  reminderHoursBefore: z.coerce.number().min(1).max(72),
  allowCancellation: z.boolean(),
  cancellationHours: z.coerce.number().min(0).max(48),
  maxBookingDaysAhead: z.coerce.number().min(1).max(365),
  aiSystemPrompt: z.string().max(2000).optional(),
  insuranceIds: z.array(z.string()),
});

type SettingsInput = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  clinic: {
    id: string;
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    primaryColor: string;
    welcomeMessage: string;
    settings?: {
      chatbotPersonality: string;
      reminderHoursBefore: number;
      allowCancellation: boolean;
      cancellationHours: number;
      maxBookingDaysAhead: number;
      aiSystemPrompt?: string | null;
    } | null;
  };
  allInsurances: Array<{ id: string; name: string }>;
  selectedInsuranceIds: string[];
  isSuperAdmin: boolean;
}

export function SettingsForm({ clinic, allInsurances, selectedInsuranceIds, isSuperAdmin }: SettingsFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: clinic.name,
      address: clinic.address ?? "",
      phone: clinic.phone ?? "",
      email: clinic.email ?? "",
      website: clinic.website ?? "",
      primaryColor: clinic.primaryColor,
      welcomeMessage: clinic.welcomeMessage,
      chatbotPersonality: (clinic.settings?.chatbotPersonality as "professional" | "friendly" | "formal") ?? "professional",
      reminderHoursBefore: clinic.settings?.reminderHoursBefore ?? 24,
      allowCancellation: clinic.settings?.allowCancellation ?? true,
      cancellationHours: clinic.settings?.cancellationHours ?? 2,
      maxBookingDaysAhead: clinic.settings?.maxBookingDaysAhead ?? 60,
      aiSystemPrompt: clinic.settings?.aiSystemPrompt ?? "",
      insuranceIds: selectedInsuranceIds,
    },
  });

  const selectedColor = watch("primaryColor");
  const insuranceIds = watch("insuranceIds");

  async function onSubmit(data: SettingsInput) {
    setError(null);
    const res = await fetch(`/api/clinics/${clinic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError("Erro ao guardar. Tente novamente.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function toggleInsurance(id: string) {
    const current = insuranceIds ?? [];
    setValue(
      "insuranceIds",
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informação Geral */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Informação Geral</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome da Clínica *</label>
            <input {...register("name")} className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
            <input {...register("phone")} type="tel" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Morada</label>
            <input {...register("address")} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email da Clínica</label>
            <input {...register("email")} type="email" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Website</label>
            <input {...register("website")} type="url" className={inputCls} placeholder="https://" />
          </div>
        </div>
      </section>

      {/* Chatbot */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Chatbot</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mensagem de Boas-Vindas</label>
            <input {...register("welcomeMessage")} className={inputCls} />
            {errors.welcomeMessage && <p className="mt-1 text-xs text-red-500">{errors.welcomeMessage.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Personalidade</label>
            <select {...register("chatbotPersonality")} className={inputCls}>
              <option value="professional">Profissional</option>
              <option value="friendly">Simpático</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Cor Principal</label>
            <input {...register("primaryColor")} type="color" className="h-9 w-16 cursor-pointer rounded border border-gray-300" />
            <span className="font-mono text-sm text-gray-500">{selectedColor}</span>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                System Prompt Personalizado{" "}
                <span className="text-xs text-gray-400">(Super Admin)</span>
              </label>
              <textarea
                {...register("aiSystemPrompt")}
                rows={5}
                className={`${inputCls} font-mono text-xs`}
                placeholder="Deixe vazio para usar o prompt padrão..."
              />
            </div>
          )}
        </div>
      </section>

      {/* Marcações */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Configurações de Marcação</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Lembrete (horas antes)</label>
            <input {...register("reminderHoursBefore")} type="number" min={1} max={72} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Máximo dias antecipação</label>
            <input {...register("maxBookingDaysAhead")} type="number" min={1} max={365} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <input {...register("allowCancellation")} type="checkbox" className="rounded" />
              Permitir cancelamento pelo paciente
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Prazo mínimo cancelamento (horas)
            </label>
            <input {...register("cancellationHours")} type="number" min={0} max={48} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Seguros */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Seguros de Saúde Aceites</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allInsurances.map((ins) => (
            <label key={ins.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2.5 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={(insuranceIds ?? []).includes(ins.id)}
                onChange={() => toggleInsurance(ins.id)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{ins.name}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Feedback e botão */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        {saved && <p className="text-sm text-green-600">✓ Guardado com sucesso</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "A guardar..." : "Guardar Definições"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
