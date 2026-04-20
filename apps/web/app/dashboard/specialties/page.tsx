"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as Switch from "@radix-ui/react-switch";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Specialty {
  id: string;
  name: string;
  durationMin: number;
  color: string;
  description: string | null;
  isActive: boolean;
  _count: { doctors: number };
}

interface FormState {
  name: string;
  durationMin: number;
  color: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  durationMin: 30,
  color: "#1D9E75",
  description: "",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/specialties");
      if (!res.ok) throw new Error("Erro ao carregar especialidades");
      const data = (await res.json()) as Specialty[];
      setSpecialties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSpecialties(); }, [fetchSpecialties]);

  // ─── Dialog helpers ──────────────────────────────────────────────────────────

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(s: Specialty) {
    setEditing(s);
    setForm({
      name: s.name,
      durationMin: s.durationMin,
      color: s.color,
      description: s.description ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  // ─── Submit (criar / editar) ─────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      durationMin: form.durationMin,
      color: form.color,
      description: form.description.trim() || null,
    };

    try {
      const url = editing ? `/api/specialties/${editing.id}` : "/api/specialties";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setFormError(json.error ?? "Erro ao guardar especialidade");
        return;
      }

      setDialogOpen(false);
      await fetchSpecialties();
    } catch {
      setFormError("Erro de ligação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Toggle ativo/inativo ────────────────────────────────────────────────────

  async function handleToggle(s: Specialty) {
    try {
      const res = await fetch(`/api/specialties/${s.id}`, { method: "DELETE" });
      if (!res.ok) return;
      await fetchSpecialties();
    } catch {
      // silencioso
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Especialidades</h1>
          <p className="text-sm text-gray-500">Gere as especialidades médicas da clínica</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#178a65] transition-colors"
        >
          <PlusIcon />
          Nova Especialidade
        </button>
      </div>

      {/* Estados de carregamento / erro */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Spinner /> <span className="ml-2">A carregar...</span>
        </div>
      )}
      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabela */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {specialties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <StethoscopeIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium">Nenhuma especialidade encontrada</p>
              <p className="text-sm">Clique em "Nova Especialidade" para adicionar.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Especialidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Médicos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {specialties.map((s) => (
                  <tr key={s.id} className={`transition-colors hover:bg-gray-50 ${!s.isActive ? "opacity-50" : ""}`}>
                    {/* Nome + cor */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          {s.description && (
                            <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{s.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Duração */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {s.durationMin} min
                    </td>
                    {/* Médicos */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        <UserIcon className="h-3 w-3" />
                        {s._count.doctors}
                      </span>
                    </td>
                    {/* Toggle ativo */}
                    <td className="px-6 py-4">
                      <Switch.Root
                        checked={s.isActive}
                        onCheckedChange={() => void handleToggle(s)}
                        className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-2"
                        style={{ backgroundColor: s.isActive ? "#1D9E75" : "#d1d5db" }}
                      >
                        <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
                      </Switch.Root>
                    </td>
                    {/* Ações */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Dialog criar / editar */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
            <Dialog.Title className="mb-1 text-lg font-semibold text-gray-900">
              {editing ? "Editar Especialidade" : "Nova Especialidade"}
            </Dialog.Title>
            <Dialog.Description className="mb-5 text-sm text-gray-500">
              {editing
                ? "Actualiza os dados da especialidade."
                : "Preenche os dados para criar uma nova especialidade."}
            </Dialog.Description>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <Label.Root htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </Label.Root>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Cardiologia"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                />
              </div>

              {/* Duração + Cor (lado a lado) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label.Root htmlFor="duration" className="text-sm font-medium text-gray-700">
                    Duração (min) <span className="text-red-500">*</span>
                  </Label.Root>
                  <input
                    id="duration"
                    type="number"
                    required
                    min={5}
                    max={480}
                    step={5}
                    value={form.durationMin}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, durationMin: parseInt(e.target.value, 10) || 30 }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label.Root htmlFor="color" className="text-sm font-medium text-gray-700">
                    Cor
                  </Label.Root>
                  <div className="flex items-center gap-2">
                    <input
                      id="color"
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                    />
                    <span className="font-mono text-xs text-gray-500">{form.color.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <Label.Root htmlFor="description" className="text-sm font-medium text-gray-700">
                  Descrição <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </Label.Root>
                <textarea
                  id="description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descrição da especialidade..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
                />
              </div>

              {/* Erro do formulário */}
              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#178a65] disabled:opacity-60 transition-colors"
                >
                  {submitting && <Spinner small />}
                  {editing ? "Guardar alterações" : "Criar especialidade"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ─── Ícones inline (sem dependência externa) ───────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  );
}

function StethoscopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <svg className={`${size} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
