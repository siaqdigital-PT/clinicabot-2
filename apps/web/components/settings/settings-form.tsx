"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

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
  chatbotSchedule: z.string().max(1000).optional(),
  chatbotPrices: z.string().max(1000).optional(),
  chatbotFaq: z.string().max(2000).optional(),
  chatbotExtraInfo: z.string().max(1000).optional(),
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
    logoUrl?: string | null;
    settings?: {
      chatbotPersonality: string;
      reminderHoursBefore: number;
      allowCancellation: boolean;
      cancellationHours: number;
      maxBookingDaysAhead: number;
      aiSystemPrompt?: string | null;
      chatbotSchedule?: string | null;
      chatbotPrices?: string | null;
      chatbotFaq?: string | null;
      chatbotExtraInfo?: string | null;
    } | null;
  };
  allInsurances: Array<{ id: string; name: string }>;
  selectedInsuranceIds: string[];
  isSuperAdmin: boolean;
}

export function SettingsForm({ clinic, allInsurances, selectedInsuranceIds, isSuperAdmin }: SettingsFormProps) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(clinic.logoUrl ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      chatbotSchedule: clinic.settings?.chatbotSchedule ?? "",
      chatbotPrices: clinic.settings?.chatbotPrices ?? "",
      chatbotFaq: clinic.settings?.chatbotFaq ?? "",
      chatbotExtraInfo: clinic.settings?.chatbotExtraInfo ?? "",
      insuranceIds: selectedInsuranceIds,
    },
  });

  const selectedColor = watch("primaryColor");
  const insuranceIds = watch("insuranceIds");

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setLogoUploading(true);
    setLogoError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clinicId", clinic.id);
    try {
      const res = await fetch("/api/upload/logo", { method: "POST", body: formData });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setLogoError(json.error ?? "Erro ao fazer upload.");
        setLogoPreview(null);
        return;
      }
      setLogoUrl(json.url);
      setLogoPreview(null);
    } catch {
      setLogoError("Erro de ligação. Tente novamente.");
      setLogoPreview(null);
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    setLogoUrl(null);
    setLogoPreview(null);
    await fetch(`/api/clinics/${clinic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: null }),
    });
  }

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
    setValue("insuranceIds", current.includes(id) ? current.filter((i) => i !== id) : [...current, id]);
  }

  const currentLogo = logoPreview ?? logoUrl;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Logo */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Logo da Clínica</h2>
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            {currentLogo ? (
              <Image src={currentLogo} alt="Logo" width={80} height={80} className="h-full w-full object-contain" unoptimized />
            ) : (
              <ImageIcon size={28} className="text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={(e) => void handleLogoChange(e)} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoUploading} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              <Upload size={14} />
              {logoUploading ? "A fazer upload..." : "Carregar logo"}
            </button>
            {currentLogo && (
              <button type="button" onClick={() => void handleRemoveLogo()} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <X size={14} /> Remover logo
              </button>
            )}
            <p className="text-xs text-gray-400">PNG, JPG, WebP ou SVG. Máx. 2MB.</p>
            {logoError && <p className="text-xs text-red-500">{logoError}</p>}
          </div>
        </div>
      </section>

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

      {/* Chatbot — Configuração básica */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Chatbot — Configuração</h2>
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
        </div>
      </section>

      {/* Chatbot — Conhecimento personalizado */}
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Chatbot — Conhecimento da Clínica</h2>
          <p className="mt-1 text-sm text-gray-500">
            Adicione informações específicas da sua clínica. O chatbot vai usar estes dados para responder às perguntas dos pacientes.
          </p>
        </div>

        <div className="space-y-5">
          {/* Horários */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              🕐 Horários de Funcionamento
            </label>
            <p className="mb-2 text-xs text-gray-400">Ex: Segunda a Sexta 8h-20h, Sábado 9h-13h, encerrado Domingos e feriados</p>
            <textarea
              {...register("chatbotSchedule")}
              rows={3}
              placeholder="Segunda a Sexta: 8h00 - 20h00&#10;Sábado: 9h00 - 13h00&#10;Domingo e feriados: Encerrado"
              className={inputCls}
            />
          </div>

          {/* Preços */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              💶 Preços e Comparticipações
            </label>
            <p className="mb-2 text-xs text-gray-400">Ex: Consulta de Clínica Geral €25, ADSE comparticipa 60%, Médis cobre totalmente</p>
            <textarea
              {...register("chatbotPrices")}
              rows={3}
              placeholder="Consulta de Clínica Geral: €25&#10;Consulta de especialidade: €45-60&#10;ADSE: comparticipa 60%&#10;Médis: cobre totalmente"
              className={inputCls}
            />
          </div>

          {/* FAQs */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ❓ Perguntas Frequentes
            </label>
            <p className="mb-2 text-xs text-gray-400">Escreva perguntas e respostas comuns. O chatbot vai usar estas para responder aos pacientes.</p>
            <textarea
              {...register("chatbotFaq")}
              rows={5}
              placeholder="P: Há estacionamento na clínica?&#10;R: Sim, temos parque gratuito para clientes.&#10;&#10;P: É necessário trazer o cartão de utente?&#10;R: Sim, por favor traga o cartão de utente e o cartão de seguro se aplicável."
              className={inputCls}
            />
          </div>

          {/* Informações extra */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ℹ️ Outras Informações
            </label>
            <p className="mb-2 text-xs text-gray-400">Qualquer outra informação útil: localização, transportes, serviços especiais, etc.</p>
            <textarea
              {...register("chatbotExtraInfo")}
              rows={3}
              placeholder="Estamos localizados junto ao Hospital Distrital, perto da paragem de autocarro n.º 12. Dispomos de serviço de enfermagem sem necessidade de marcação."
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* System Prompt — apenas Super Admin */}
      {isSuperAdmin && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            System Prompt Avançado{" "}
            <span className="text-xs font-normal text-gray-400">(Super Admin)</span>
          </h2>
          <p className="mb-4 text-xs text-gray-400">Substitui completamente o prompt base. Deixe vazio para usar o prompt padrão.</p>
          <textarea
            {...register("aiSystemPrompt")}
            rows={6}
            className={`${inputCls} font-mono text-xs`}
            placeholder="Deixe vazio para usar o prompt padrão..."
          />
        </section>
      )}

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
            <label className="mb-1 block text-sm font-medium text-gray-700">Prazo mínimo cancelamento (horas)</label>
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
