"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarAppointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  scheduledAt: string;
  durationMin: number;
  status: string;
  insuranceName: string | null;
  doctor: { name: string; specialty: { name: string; color: string } | null };
}

const STATUS: Record<string, { label: string; pill: string; dot: string }> = {
  PENDING:   { label: "Pendente",   pill: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400" },
  CONFIRMED: { label: "Confirmada", pill: "bg-green-100 text-green-800",   dot: "bg-green-500"  },
  CANCELLED: { label: "Cancelada",  pill: "bg-red-100 text-red-700",       dot: "bg-red-400"    },
  COMPLETED: { label: "Concluída",  pill: "bg-gray-100 text-gray-600",     dot: "bg-gray-400"   },
  NO_SHOW:   { label: "Falta",      pill: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDow + 6) % 7; // Mon-first
  const cells: (number | null)[] = Array<null>(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

// ─── Main component ────────────────────────────────────────────────────────

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CalendarAppointment | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/appointments/calendar?month=${monthStr}`);
      const data = (await res.json()) as { appointments: CalendarAppointment[] };
      setAppointments(data.appointments);
    } catch {}
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  function navigate(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setExpandedDay(null);
    setSelected(null);
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    void fetchCalendar();
  }

  // Group appointments by date key
  const byDay = new Map<string, CalendarAppointment[]>();
  for (const appt of appointments) {
    const d = new Date(appt.scheduledAt);
    const key = toKey(d.getFullYear(), d.getMonth(), d.getDate());
    byDay.set(key, [...(byDay.get(key) ?? []), appt]);
  }

  const grid = buildGrid(year, month);
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-400">
            A carregar...
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Weekday headers */}
            <div className="grid min-w-[560px] grid-cols-7 border-b border-gray-100">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid min-w-[560px] grid-cols-7">
              {grid.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50/50"
                    />
                  );
                }

                const key = toKey(year, month, day);
                const dayAppts = byDay.get(key) ?? [];
                const isToday = key === todayKey;
                const isExpanded = expandedDay === key;
                const visible = isExpanded ? dayAppts : dayAppts.slice(0, 3);
                const extra = dayAppts.length - 3;

                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-[110px] border-b border-r border-gray-100 p-1.5 transition-colors hover:bg-gray-50/80",
                      isToday && "ring-2 ring-inset ring-[#1D9E75]/50"
                    )}
                  >
                    {/* Day number */}
                    <div
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday
                          ? "bg-[#1D9E75] text-white"
                          : "text-gray-600"
                      )}
                    >
                      {day}
                    </div>

                    {/* Appointment pills */}
                    <div className="space-y-0.5">
                      {visible.map((appt) => {
                        const s = STATUS[appt.status] ?? STATUS.PENDING;
                        return (
                          <button
                            key={appt.id}
                            onClick={() => setSelected(appt)}
                            title={`${fmtTime(appt.scheduledAt)} — ${appt.patientName}`}
                            className={cn(
                              "w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight transition-opacity hover:opacity-75",
                              s.pill
                            )}
                          >
                            {fmtTime(appt.scheduledAt)}{" "}
                            {appt.patientName}
                          </button>
                        );
                      })}

                      {!isExpanded && extra > 0 && (
                        <button
                          onClick={() => setExpandedDay(key)}
                          className="w-full rounded px-1.5 py-0.5 text-left text-[11px] text-gray-500 hover:text-gray-700"
                        >
                          +{extra} mais
                        </button>
                      )}
                      {isExpanded && dayAppts.length > 3 && (
                        <button
                          onClick={() => setExpandedDay(null)}
                          className="w-full rounded px-1.5 py-0.5 text-left text-[11px] text-gray-400 hover:text-gray-600"
                        >
                          ver menos
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 px-6 py-3">
          {Object.entries(STATUS).map(([, { label, dot }]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={cn("h-2 w-2 rounded-full", dot)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}

// ─── Detail modal ──────────────────────────────────────────────────────────

function AppointmentModal({
  appointment: appt,
  onClose,
  onStatusChange,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const s = STATUS[appt.status] ?? STATUS.PENDING;

  async function handleStatus(status: string) {
    setUpdating(true);
    await onStatusChange(appt.id, status);
    setUpdating(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Detalhe da Marcação</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", s.pill)}>
            {s.label}
          </span>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <DetailField label="Paciente" value={appt.patientName} />
            <DetailField label="Email" value={appt.patientEmail} />
            <DetailField label="Telefone" value={appt.patientPhone ?? "—"} />
            <DetailField label="Seguro" value={appt.insuranceName ?? "—"} />
            <DetailField label="Médico" value={appt.doctor.name} />
            <DetailField
              label="Especialidade"
              value={appt.doctor.specialty?.name ?? "—"}
            />
            <DetailField
              label="Data"
              value={new Date(appt.scheduledAt).toLocaleDateString("pt-PT", {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Europe/Lisbon",
              })}
            />
            <DetailField
              label="Hora"
              value={`${fmtTime(appt.scheduledAt)} (${appt.durationMin} min)`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {appt.status === "PENDING" && (
            <button
              onClick={() => void handleStatus("CONFIRMED")}
              disabled={updating}
              className="flex items-center gap-1.5 rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15745a] disabled:opacity-50"
            >
              <Check size={15} /> Confirmar
            </button>
          )}
          {appt.status !== "CANCELLED" && (
            <button
              onClick={() => void handleStatus("CANCELLED")}
              disabled={updating}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle size={15} /> Cancelar
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-gray-400">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  );
}
