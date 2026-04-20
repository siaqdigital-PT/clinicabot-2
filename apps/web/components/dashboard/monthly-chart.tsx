"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthData {
  month: string;
  label: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export function MonthlyChart() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/monthly?months=6")
      .then((r) => r.json())
      .then((d: MonthData[]) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Marcações por Mês (últimos 6 meses)
      </h2>

      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <p className="text-sm text-gray-400">A carregar...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="completed" name="Concluídas" fill="#1D9E75" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cancelled" name="Canceladas" fill="#f87171" radius={[3, 3, 0, 0]} />
            <Bar dataKey="noShow" name="Faltas" fill="#fb923c" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
