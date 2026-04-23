"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import { slugify } from "@clinicabot/utils";

interface GlobalStats {
  totalClinics: number;
  totalAppointments: number;
  totalChatSessions: number;
  estimatedRevenue: number;
  clinicsByPlan: Record<string, number>;
}

interface ClinicRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  primaryColor: string;
  createdAt: string;
  _count: { appointments: number; chatSessions: number; users: number };
}

interface FormState {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  primaryColor: string;
}

interface CreatedResult {
  clinic: { name: string; slug: string };
  adminEmail: string;
  tempPassword: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  primaryColor: "#1D9E75",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedResult | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const statsRes = await fetch("/api/admin/stats").catch(() => null);
    if (!statsRes || statsRes.status === 403 || statsRes.status === 401) {
      router.replace("/dashboard");
      return;
    }
    const [statsData, clinicsRes] = await Promise.all([
      statsRes.json() as Promise<GlobalStats>,
      fetch("/api/admin/clinics").catch(() => null),
    ]);
    setStats(statsData);
    if (clinicsRes?.ok) {
      setClinics((await clinicsRes.json()) as ClinicRow[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          primaryColor: form.primaryColor,
        }),
      });
      const json = (await res.json()) as { error?: string } & Partial<CreatedResult>;
      if (!res.ok) {
        setFormError(json.error ?? "Erro ao criar clínica");
        return;
      }
      setCreated(json as CreatedResult);
      await fetchData();
    } catch {
      setFormError("Erro de ligação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setFormError(null);
      setCreated(null);
    } else {
      setDialogOpen(true);
    }
  }

  const filteredClinics = clinics.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
          <p className="text-sm text-gray-500">Gestão global de todas as clínicas</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#178a65] transition-colors"
        >
          <PlusIcon />
          Nova Clínica
        </button>
      </div>

      {/* Cards de resumo */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total de clínicas" value={stats.totalClinics} color="blue" icon={<BuildingIcon />} />
          <StatCard label="Total de marcações" value={stats.totalAppointments} color="green" icon={<CalendarIcon />} />
          <StatCard label="Total de conversas" value={stats.totalChatSessions} color="purple" icon={<ChatIcon />} />
        </div>
      ) : null}

      {/* Tabela de clínicas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar clínica..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Spinner /> <span className="ml-2">A carregar...</span>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BuildingIcon className="mb-2 h-10 w-10 text-gray-300" />
            <p className="font-medium">Nenhuma clínica encontrada</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Clínica</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Marcações</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Conversas</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredClinics.map((clinic) => (
                <tr
                  key={clinic.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/dashboard/admin/clinics/${clinic.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex-shrink-0 rounded-lg" style={{ backgroundColor: clinic.primaryColor }} />
                      <div>
                        <p className="font-medium text-gray-900">{clinic.name}</p>
                        <p className="text-xs text-gray-400">/{clinic.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-700">{clinic._count.appointments}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-700">{clinic._count.chatSessions}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${clinic.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${clinic.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                      {clinic.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{formatDate(clinic.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialog nova clínica */}
      <Dialog.Root open={dialogOpen} onOpenChange={handleDialogClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
            {created ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CheckIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">Clínica criada com sucesso!</Dialog.Title>
                    <p className="text-sm text-gray-500">{created.clinic.name}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">Credenciais de acesso — guarda antes de fechar</p>
                  <div className="space-y-2">
                    <CredentialRow label="Email" value={created.adminEmail} />
                    <CredentialRow label="Password temporária" value={created.tempPassword} mono />
                    <CredentialRow label="URL de acesso" value="/dashboard" />
                  </div>
                  <p className="text-xs text-amber-700">O admin deverá alterar a password no primeiro acesso.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Dialog.Close asChild>
                    <button className="rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#178a65] transition-colors">
                      Fechar
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            ) : (
              <>
                <Dialog.Title className="mb-1 text-lg font-semibold text-gray-900">Nova Clínica</Dialog.Title>
                <Dialog.Description className="mb-5 text-sm text-gray-500">
                  Preenche os dados para criar a clínica e o seu utilizador administrador.
                </Dialog.Description>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label.Root htmlFor="c-name" className="text-sm font-medium text-gray-700">
                      Nome da clínica <span className="text-red-500">*</span>
                    </Label.Root>
                    <input
                      id="c-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Clínica São João"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label.Root htmlFor="c-slug" className="text-sm font-medium text-gray-700">Slug (URL do widget)</Label.Root>
                    <div className="flex items-center rounded-lg border border-gray-300 focus-within:border-[#1D9E75] focus-within:ring-1 focus-within:ring-[#1D9E75]">
                      <span className="select-none border-r border-gray-200 px-3 py-2 text-sm text-gray-400">/widget/</span>
                      <input
                        id="c-slug"
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        placeholder="clinica-sao-joao"
                        className="flex-1 rounded-r-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label.Root htmlFor="c-email" className="text-sm font-medium text-gray-700">
                        Email admin <span className="text-red-500">*</span>
                      </Label.Root>
                      <input
                        id="c-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="admin@clinica.pt"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label.Root htmlFor="c-phone" className="text-sm font-medium text-gray-700">Telefone</Label.Root>
                      <input
                        id="c-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="258 000 000"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label.Root htmlFor="c-address" className="text-sm font-medium text-gray-700">Morada</Label.Root>
                    <input
                      id="c-address"
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Rua de exemplo, n.º 1, Lisboa"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label.Root htmlFor="c-color" className="text-sm font-medium text-gray-700">Cor principal</Label.Root>
                    <div className="flex items-center gap-2">
                      <input
                        id="c-color"
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                      />
                      <span className="font-mono text-xs text-gray-500">{form.primaryColor.toUpperCase()}</span>
                    </div>
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Dialog.Close asChild>
                      <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#178a65] disabled:opacity-60 transition-colors"
                    >
                      {submitting && <Spinner small />}
                      Criar clínica
                    </button>
                  </div>
                </form>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: "blue" | "green" | "purple"; icon: React.ReactNode }) {
  const colors = { blue: "text-blue-600", green: "text-emerald-700", purple: "text-purple-700" };
  const bgs = { blue: "bg-blue-50", green: "bg-emerald-50", purple: "bg-purple-50" };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${bgs[color]} ${colors[color]}`}>{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function CredentialRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-amber-700">{label}:</span>
      <span className={`rounded bg-white px-2 py-0.5 text-xs font-semibold text-gray-800 ${mono ? "font-mono tracking-wider" : ""}`}>{value}</span>
    </div>
  );
}

function PlusIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
}

function BuildingIcon({ className }: { className?: string }) {
  return <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l.75 18H3.75L4.5 3zM9 9h.008v.008H9V9zm0 3h.008v.008H9V12zm0 3h.008v.008H9V15zm4.5-6H13.5v.008H13.5V9zm0 3H13.5v.008H13.5V12zm0 3H13.5v.008H13.5V15z" /></svg>;
}

function CalendarIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" /></svg>;
}

function ChatIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className ?? "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>;
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? "h-3.5 w-3.5" : "h-5 w-5";
  return <svg className={`${size} animate-spin`} viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
