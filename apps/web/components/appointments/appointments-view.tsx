use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Download, List, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewAppointmentDialog } from "./new-appointment-dialog";
import { CalendarView } from "./calendar-view";

const LS_VIEW_KEY = "cb_appt_view";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  specialtyName: string | null;
  insuranceName: string | null;
  scheduledAt: string;
  status: string;
  doctor: { name: string; specialty: { name: string; color: string } | null };
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING:   { label: "Pendente",   class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "Confirmada", class: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelada",  class: "bg-red-100 text-red-700 border-red-200" },
  COMPLETED: { label: "Concluída",  class: "bg-gray-100 text-gray-600 border-gray-200" },
  NO_SHOW:   { label: "Falta",      class: "bg-orange-100 text-orange-700 border-orange-200" },
};

export function AppointmentsView() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>(undefined);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const saved = localStorage.getItem(LS_VIEW_KEY);
    if (saved === "calendar" || saved === "list") setView(saved);
  }, []);

  function switchView(v: "list" | "calendar") {
    setView(v);
    localStorage.setItem(LS_VIEW_KEY, v);
  }

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });

    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json() as { data: Appointment[]; total: number };
    setAppointments(data.data);
    setTotal(data.total);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { void fetchAppointments(); }, [fetchAppointments]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void fetchAppointments();
  }

  function exportCSV() {
    const rows = [
      ["ID", "Paciente", "Email", "Telefone", "Especialidade", "Médico", "Data", "Estado", "Seguro"],
      ...appointments.map((a) => [
        a.id,
        a.patientName,
        a.patientEmail,
        a.patientPhone ?? "",
        a.specialtyName ?? a.doctor.specialty?.name ?? "",
        a.doctor.name,
        new Date(a.scheduledAt).toLocaleString("pt-PT"),
        STATUS_LABELS[a.status]?.label ?? a.status,
        a.insuranceName ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marcacoes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCalendarDayClick(date: Date) {
    setPrefilledDate(date);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) setPrefilledDate(undefined);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Toggle Lista / Calendário */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          <button
            onClick={() => switchView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List size={15} /> Lista
          </button>
          <button
            onClick={() => switchView("calendar")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "calendar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <CalendarDays size={15} /> Calendário
          </button>
        </div>

        {/* Pesquisa, filtro e ações — apenas na vista de lista */}
        {view === "list" && (
          <>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar paciente ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Todos os estados</option>
              {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={15} /> Exportar CSV
            </button>
          </>
        )}

        <button
          onClick={() => { setPrefilledDate(undefined); setDialogOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={15} /> Nova Marcação
        </button>
      </div>

      <NewAppointmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        defaultDate={prefilledDate}
        onCreated={() => { setDialogOpen(false); setPrefilledDate(undefined); void fetchAppointments(); }}
      />

      {/* Vista de calendário */}
      {view === "calendar" && (
        <CalendarView onNewAppointment={handleCalendarDayClick} />
      )}

      {/* Tabela — apenas na vista de lista */}
      {view === "list" && (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {["Paciente", "Especialidade / Médico", "Data e Hora", "Seguro", "Estado", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    A carregar...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Nenhuma marcação encontrada
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => {
                  const s = STATUS_LABELS[appt.status] ?? STATUS_LABELS.PENDING;
                  const specialty = appt.specialtyName ?? appt.doctor.specialty?.name ?? "—";
                  return (
                    <tr key={appt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{appt.patientName}</p>
                        <p className="text-xs text-gray-400">{appt.patientEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {appt.doctor.specialty && (
                            <div
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: appt.doctor.specialty.color }}
                            />
                          )}
                          <div>
                            <p className="text-gray-900">{specialty}</p>
                            <p className="text-xs text-gray-400">{appt.doctor.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(appt.scheduledAt).toLocaleString("pt-PT", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "Europe/Lisbon",
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {appt.insuranceName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", s.class)}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) void updateStatus(appt.id, e.target.value); }}
                          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:outline-none"
                        >
                          <option value="" disabled>Alterar</option>
                          {Object.entries(STATUS_LABELS)
                            .filter(([v]) => v !== appt.status)
                            .map(([v, { label }]) => (
                              <option key={v} value={v}>{label}</option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded border border-gray-300 px-3 py-1 text-xs disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded border border-gray-300 px-3 py-1 text-xs disabled:opacity-40"
              >
                Seguinte
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
