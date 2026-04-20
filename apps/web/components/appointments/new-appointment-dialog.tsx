"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Specialty {
  id: string;
  name: string;
  durationMin: number;
}

interface Doctor {
  id: string;
  name: string;
  specialty: { id: string; name: string; durationMin: number } | null;
}

interface FormState {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  specialtyId: string;
  doctorId: string;
  date: string;
  time: string;
  insuranceName: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  patientName: "",
  patientEmail: "",
  patientPhone: "",
  specialtyId: "",
  doctorId: "",
  date: "",
  time: "",
  insuranceName: "",
  notes: "",
};

const PT_INSURANCES = [
  "ADSE",
  "Médis",
  "Multicare",
  "AdvanceCare",
  "Fidelidade",
  "GNB Saúde",
  "Tranquilidade",
  "Lusíadas",
];

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] disabled:bg-gray-50 disabled:text-gray-400";

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function NewAppointmentDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carregar especialidades ao abrir
  useEffect(() => {
    if (!open) return;
    fetch("/api/specialties")
      .then((r) => r.json())
      .then((data: unknown) => setSpecialties(Array.isArray(data) ? data : (data as { data?: Specialty[] }).data ?? []))
      .catch(console.error);
  }, [open]);

  // Carregar médicos quando muda a especialidade
  useEffect(() => {
    if (!form.specialtyId) { setDoctors([]); return; }
    setLoadingDoctors(true);
    setForm((f) => ({ ...f, doctorId: "", time: "" }));
    setSlots([]);
    fetch(`/api/doctors?specialtyId=${form.specialtyId}`)
      .then((r) => r.json())
      .then((data: unknown) => setDoctors(Array.isArray(data) ? data : (data as { data?: Doctor[]; doctors?: Doctor[] }).data ?? (data as { doctors?: Doctor[] }).doctors ?? []))
      .catch(console.error)
      .finally(() => setLoadingDoctors(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.specialtyId]);

  // Carregar horários quando muda o médico OU a data
  const loadSlots = useCallback(async (doctorId: string, date: string) => {
    if (!doctorId || !date) { setSlots([]); return; }
    setLoadingSlots(true);
    setForm((f) => ({ ...f, time: "" }));
    try {
      const res = await fetch(`/api/availability/slots?doctorId=${doctorId}&date=${date}`);
      const data = await res.json() as { slots: string[] };
      setSlots(data.slots ?? []);
    } catch (err) {
      console.error(err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots(form.doctorId, form.date);
  }, [form.doctorId, form.date, loadSlots]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.time) { setError("Selecione um horário disponível."); return; }

    setSubmitting(true);
    setError(null);

    // Construir ISO datetime: date + time no fuso de Lisboa
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();

    // Obter durationMin do médico selecionado
    const selectedDoctor = doctors.find((d) => d.id === form.doctorId);
    const durationMin = selectedDoctor?.specialty?.durationMin ?? 30;

    // Obter specialtyName
    const selectedSpecialty = specialties.find((s) => s.id === form.specialtyId);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: form.doctorId,
          patientName: form.patientName.trim(),
          patientEmail: form.patientEmail.trim(),
          patientPhone: form.patientPhone.trim() || undefined,
          specialtyName: selectedSpecialty?.name ?? "",
          scheduledAt,
          durationMin,
          insuranceName: form.insuranceName || undefined,
          notes: form.notes.trim() || undefined,
          status: "CONFIRMED",
        }),
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao criar marcação.");
        return;
      }

      setSuccess(true);
      onCreated();
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setForm(EMPTY_FORM);
      setDoctors([]);
      setSlots([]);
      setError(null);
      setSuccess(false);
    }
    onOpenChange(open);
  }

  // Data mínima = hoje
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none max-h-[90vh] overflow-y-auto">
          {success ? (
            /* Ecrã de sucesso */
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Marcação criada!
              </Dialog.Title>
              <p className="mt-2 text-sm text-gray-500">
                O email de confirmação foi enviado para {form.patientEmail}.
              </p>
              <Dialog.Close asChild>
                <button className="mt-6 rounded-lg bg-[#1D9E75] px-6 py-2 text-sm font-medium text-white hover:bg-[#178a65] transition-colors">
                  Fechar
                </button>
              </Dialog.Close>
            </div>
          ) : (
            <>
              <Dialog.Title className="mb-1 text-lg font-semibold text-gray-900">
                Nova Marcação Manual
              </Dialog.Title>
              <Dialog.Description className="mb-5 text-sm text-gray-500">
                Cria uma marcação confirmada para um paciente que contactou a clínica.
              </Dialog.Description>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {/* Dados do paciente */}
                <fieldset className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Dados do paciente
                  </legend>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={form.patientName}
                        onChange={(e) => set("patientName", e.target.value)}
                        placeholder="João Silva"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={form.patientPhone}
                        onChange={(e) => set("patientPhone", e.target.value)}
                        placeholder="912 000 000"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={form.patientEmail}
                      onChange={(e) => set("patientEmail", e.target.value)}
                      placeholder="joao@email.com"
                      className={inputCls}
                    />
                  </div>
                </fieldset>

                {/* Consulta */}
                <fieldset className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Consulta
                  </legend>

                  {/* Especialidade */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Especialidade <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.specialtyId}
                      onChange={(e) => set("specialtyId", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Selecionar especialidade...</option>
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Médico */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Médico <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.doctorId}
                      onChange={(e) => set("doctorId", e.target.value)}
                      disabled={!form.specialtyId || loadingDoctors}
                      className={inputCls}
                    >
                      <option value="">
                        {loadingDoctors ? "A carregar..." : "Selecionar médico..."}
                      </option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {form.specialtyId && !loadingDoctors && doctors.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        Nenhum médico disponível para esta especialidade.
                      </p>
                    )}
                  </div>

                  {/* Data + Hora */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Data <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        min={today}
                        value={form.date}
                        onChange={(e) => set("date", e.target.value)}
                        disabled={!form.doctorId}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Horário <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={form.time}
                        onChange={(e) => set("time", e.target.value)}
                        disabled={!form.date || !form.doctorId || loadingSlots}
                        className={inputCls}
                      >
                        <option value="">
                          {loadingSlots
                            ? "A carregar..."
                            : slots.length === 0 && form.date && form.doctorId
                            ? "Sem horários"
                            : "Selecionar horário..."}
                        </option>
                        {slots.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {!loadingSlots && slots.length === 0 && form.date && form.doctorId && (
                        <p className="mt-1 text-xs text-amber-600">
                          Sem disponibilidade neste dia.
                        </p>
                      )}
                    </div>
                  </div>
                </fieldset>

                {/* Seguro + Notas */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Seguro de saúde</label>
                  <select
                    value={form.insuranceName}
                    onChange={(e) => set("insuranceName", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Sem seguro / Particular</option>
                    {PT_INSURANCES.map((ins) => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Notas internas</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Observações relevantes para a consulta..."
                    className={inputCls}
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

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
                    {submitting && (
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    Criar marcação
                  </button>
                </div>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
