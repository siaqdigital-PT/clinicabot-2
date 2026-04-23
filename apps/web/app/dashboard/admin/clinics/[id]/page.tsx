"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { KeyRound } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClinicDetail {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  plan: string;
  isActive: boolean;
  primaryColor: string;
  createdAt: string;
  doctors: {
    id: string;
    name: string;
    email: string | null;
    specialty: { name: string } | null;
  }[];
  specialties: { id: string; name: string; durationMin: number; color: string }[];
  appointments: {
    id: string;
    patientName: string;
    patientEmail: string;
    scheduledAt: string;
    status: string;
    doctor: { name: string; specialty: { name: string } | null } | null;
  }[];
  users: { id: string; name: string | null; email: string; role: string }[];
  _count: {
    appointments: number;
    chatSessions: number;
    doctors: number;
    specialties: number;
    users: number;
  };
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PLAN_COLORS: Record<string, string> = {
  PILOT: "bg-gray-100 text-gray-600",
  STARTER: "bg-blue-100 text-blue-700",
  CLINIC: "bg-emerald-100 text-emerald-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
  NO_SHOW: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CLINIC_ADMIN: "Administrador",
  RECEPTIONIST: "Rececionista",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ClinicDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [clinic, setClinic] = useState<ClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const authRes = await fetch("/api/admin/stats").catch(() => null);
      if (!authRes || authRes.status === 403 || authRes.status === 401) {
        router.replace("/dashboard");
        return;
      }

      const res = await fetch(`/api/admin/clinics/${params.id}`).catch(() => null);
      if (!res) { setError("Erro de ligação."); setLoading(false); return; }
      if (res.status === 404) { setError("Clínica não encontrada."); setLoading(false); return; }
      if (!res.ok) { setError("Erro ao carregar dados."); setLoading(false); return; }

      setClinic(await res.json() as ClinicDetail);
      setLoading(false);
    }
    void load();
  }, [params.id, router]);

  async function handleResetPassword(userId: string, userEmail: string) {
    setResettingUser(userId);
    setResetSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      const json = await res.json() as { error?: string; email?: string };

      if (!res.ok) {
        alert(json.error ?? "Erro ao resetar password.");
        return;
      }

      setResetSuccess(userEmail);
      setTimeout(() => setResetSuccess(null), 5000);
    } catch {
      alert("Erro de ligação.");
    } finally {
      setResettingUser(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Spinner /> <span className="ml-2">A carregar...</span>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <p className="text-lg font-medium">{error ?? "Clínica não encontrada"}</p>
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="mt-4 rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#178a65] transition-colors"
        >
          Voltar à administração
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 flex-shrink-0 rounded-xl"
            style={{ backgroundColor: clinic.primaryColor }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLORS[clinic.plan] ?? "bg-gray-100 text-gray-600"}`}>
                {clinic.plan}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${clinic.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${clinic.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                {clinic.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-400">
              /{clinic.slug}
              {clinic.email && <span className="ml-3">{clinic.email}</span>}
              {clinic.phone && <span className="ml-3">{clinic.phone}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Voltar à administração
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Marcações" value={clinic._count.appointments} color="green" />
        <StatCard label="Conversas" value={clinic._count.chatSessions} color="purple" />
        <StatCard label="Médicos ativos" value={clinic._count.doctors} color="blue" />
        <StatCard label="Especialidades" value={clinic._count.specialties} color="amber" />
      </div>

      {/* Utilizadores */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Utilizadores ({clinic.users.length})</h2>
          <p className="text-xs text-gray-400 mt-0.5">Clique em "Resetar password" para enviar um link de redefinição por email</p>
        </div>
        {resetSuccess && (
          <div className="mx-5 mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
            ✓ Link de reset enviado para <strong>{resetSuccess}</strong>
          </div>
        )}
        {clinic.users.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum utilizador registado</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-50 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Função</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {clinic.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => void handleResetPassword(u.id, u.email)}
                      disabled={resettingUser === u.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                    >
                      <KeyRound size={12} />
                      {resettingUser === u.id ? "A enviar..." : "Resetar password"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Médicos */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Médicos ({clinic.doctors.length})</h2>
          </div>
          {clinic.doctors.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhum médico registado</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-50 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Especialidade</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {clinic.doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-5 py-3 text-gray-500">{d.specialty?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-400">{d.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Especialidades */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Especialidades ({clinic.specialties.length})</h2>
          </div>
          {clinic.specialties.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma especialidade registada</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-50 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nome</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {clinic.specialties.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="font-medium text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">{s.durationMin} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Últimas marcações */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Últimas marcações</h2>
        </div>
        {clinic.appointments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma marcação ainda</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-50 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Paciente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Médico / Especialidade</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Data</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {clinic.appointments.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{a.patientName}</p>
                    <p className="text-xs text-gray-400">{a.patientEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-700">{a.doctor?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{a.doctor?.specialty?.name ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(a.scheduledAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "green" | "purple" | "amber" }) {
  const colors = {
    blue: "text-blue-700",
    green: "text-emerald-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
