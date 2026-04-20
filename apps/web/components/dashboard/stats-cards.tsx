"use client";

import { useEffect, useState } from "react";
import { Calendar, TrendingUp, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@clinicabot/types";

interface StatsCardsProps {
  clinicFilter: Record<string, unknown>;
}

export function StatsCards(_props: StatsCardsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((r) => r.json())
      .then((data: DashboardStats) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Marcações Hoje",
      value: stats?.appointmentsToday ?? 0,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Esta Semana",
      value: stats?.appointmentsThisWeek ?? 0,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Taxa Ocupação",
      value: stats ? `${stats.occupancyRate}%` : "—",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Conversão Chat",
      value: stats ? `${stats.chatConversionRate}%` : "—",
      icon: MessageSquare,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <div className={cn("rounded-lg p-2", card.bg)}>
              <card.icon size={18} className={card.color} />
            </div>
          </div>
          <p className={cn("mt-3 text-2xl font-bold", loading ? "text-gray-300" : "text-gray-900")}>
            {loading ? "..." : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
