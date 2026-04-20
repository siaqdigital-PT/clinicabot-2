"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Summary {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  noShowRate: number;
}

interface MonthlyRow {
  month: string;
  label: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  bySpecialty: Record<string, number>;
}

interface WeekdayRow {
  day: string;
  consultas: number;
}

interface TopSpecialty {
  name: string;
  total: number;
  pct: number;
}

// ─── Cores ────────────────────────────────────────────────────────────────────

const COLOR_TOTAL = "#3b82f6";
const COLOR_COMPLETED = "#22c55e";
const COLOR_CANCELLED = "#ef4444";
const COLOR_NOSHOW = "#f59e0b";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [weekday, setWeekday] = useState<WeekdayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Cada fetch é independente — falha de um não afecta os outros
    await Promise.all([
      fetch("/api/reports/summary")
        .then((r) => {
          if (!r.ok) throw new Error(`summary ${r.status}`);
          return r.json() as Promise<Summary>;
        })
        .then(setSummary)
        .catch((e: unknown) => console.error("[reports] summary:", e)),

      fetch("/api/reports/monthly?months=6")
        .then((r) => {
          if (!r.ok) throw new Error(`monthly ${r.status}`);
          return r.json() as Promise<MonthlyRow[]>;
        })
        .then(setMonthly)
        .catch((e: unknown) => console.error("[reports] monthly:", e)),

      fetch("/api/reports/by-weekday")
        .then((r) => {
          if (!r.ok) throw new Error(`by-weekday ${r.status}`);
          return r.json() as Promise<WeekdayRow[]>;
        })
        .then(setWeekday)
        .catch((e: unknown) => console.error("[reports] by-weekday:", e)),
    ]);

    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ── Top especialidades: agregar últimos 3 meses ────────────────────────────
  const topSpecialties: TopSpecialty[] = React.useMemo(() => {
    const last3 = monthly.slice(-3);
    const agg: Record<string, number> = {};
    for (const row of last3) {
      for (const [name, count] of Object.entries(row.bySpecialty)) {
        agg[name] = (agg[name] ?? 0) + count;
      }
    }
    const grandTotal = Object.values(agg).reduce((a, b) => a + b, 0);
    return Object.entries(agg)
      .map(([name, total]) => ({
        name,
        total,
        pct: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [monthly]);

  // ── Label curto do mês (ex: "Jan", "Fev") ──────────────────────────────────
  const monthlyChartData = monthly.map((r) => ({
    ...r,
    label: r.label.split(" ")[0] ?? r.label, // "Jan 2025" → "Jan"
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Spinner /> <span className="ml-2">A carregar relatórios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Métricas e estatísticas da clínica</p>
      </div>

      {/* 1. Cards de resumo */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Consultas hoje"
            value={summary.appointmentsToday}
            icon={<CalendarTodayIcon />}
            color="blue"
          />
          <SummaryCard
            label="Esta semana"
            value={summary.appointmentsThisWeek}
            icon={<CalendarWeekIcon />}
            color="green"
          />
          <SummaryCard
            label="Este mês"
            value={summary.appointmentsThisMonth}
            icon={<CalendarMonthIcon />}
            color="purple"
          />
          <SummaryCard
            label="Taxa de no-show"
            value={`${summary.noShowRate}%`}
            icon={<NoShowIcon />}
            color={summary.noShowRate > 15 ? "red" : "amber"}
            sub="consultas passadas"
          />
        </div>
      )}

      {/* 2. Gráfico mensal */}
      <Section title="Evolução mensal" sub="Últimos 6 meses">
        {monthly.length === 0 ? (
          <EmptyState label="Sem dados mensais" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e5e7eb" }}
                cursor={{ fill: "#f9fafb" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) =>
                  value === "total"
                    ? "Total"
                    : value === "completed"
                      ? "Completadas"
                      : value === "cancelled"
                        ? "Canceladas"
                        : "No-shows"
                }
              />
              <Bar dataKey="total" fill={COLOR_TOTAL} radius={[3, 3, 0, 0]} />
              <Bar dataKey="completed" fill={COLOR_COMPLETED} radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancelled" fill={COLOR_CANCELLED} radius={[3, 3, 0, 0]} />
              <Bar dataKey="noShow" fill={COLOR_NOSHOW} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Grid de 2 colunas para as duas secções restantes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 3. Top especialidades */}
        <Section title="Top especialidades" sub="Últimos 3 meses">
          {topSpecialties.length === 0 ? (
            <EmptyState label="Sem dados de especialidades" />
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Especialidade
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Consultas
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      % Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {topSpecialties.map((s, i) => (
                    <tr key={s.name} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center text-xs font-bold text-gray-400">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-700">
                        {s.total}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#1D9E75]"
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs text-gray-500">{s.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* 4. Consultas por dia da semana */}
        <Section title="Consultas por dia da semana" sub="Últimos 3 meses (excluindo canceladas)">
          {weekday.length === 0 || weekday.every((d) => d.consultas === 0) ? (
            <EmptyState label="Sem dados por dia da semana" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekday} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #e5e7eb" }}
                  cursor={{ fill: "#f9fafb" }}
                  formatter={(v: number) => [v, "Consultas"]}
                />
                <Bar dataKey="consultas" fill={COLOR_TOTAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>
    </div>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" },
  red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500" },
} as const;

function SummaryCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: keyof typeof colorMap;
  sub?: string;
}) {
  const c = colorMap[color];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${c.bg}`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-gray-400">{label}</div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Ícones SVG inline ─────────────────────────────────────────────────────────

function CalendarTodayIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CalendarWeekIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarMonthIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      <path d="M8 14h2m4 0h2M8 18h2m4 0h2" strokeLinecap="round" />
    </svg>
  );
}

function NoShowIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  );
}
