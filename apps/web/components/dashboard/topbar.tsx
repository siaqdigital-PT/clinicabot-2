"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, ChevronLeft } from "lucide-react";
import { getInitials } from "@clinicabot/utils";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { usePathname, useRouter } from "next/navigation";

interface TopBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Administrador",
  CLINIC_ADMIN: "Administrador",
  RECEPTIONIST: "Rececionista",
};

// Mapeamento de rotas para label e destino do botão voltar
const backRoutes: Record<string, { label: string; href: string }> = {
  "/dashboard/admin/clinics": { label: "Administração", href: "/dashboard/admin" },
  "/dashboard/appointments": { label: "Marcações", href: "/dashboard" },
  "/dashboard/doctors": { label: "Médicos", href: "/dashboard" },
  "/dashboard/specialties": { label: "Especialidades", href: "/dashboard" },
  "/dashboard/chat": { label: "Conversas", href: "/dashboard" },
  "/dashboard/reports": { label: "Relatórios", href: "/dashboard" },
  "/dashboard/settings": { label: "Definições", href: "/dashboard" },
  "/dashboard/account": { label: "A minha conta", href: "/dashboard" },
};

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determinar se deve mostrar botão voltar
  function getBackRoute() {
    // Verificar rota exata primeiro
    if (backRoutes[pathname]) return backRoutes[pathname];
    // Verificar prefixos (para páginas de detalhe como /dashboard/admin/clinics/[id])
    for (const [route, back] of Object.entries(backRoutes)) {
      if (pathname.startsWith(route + "/")) return back;
    }
    return null;
  }

  const backRoute = getBackRoute();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Botão voltar */}
      <div>
        {backRoute ? (
          <button
            onClick={() => router.push(backRoute.href)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <ChevronLeft size={16} />
            {backRoute.label}
          </button>
        ) : (
          <div id="breadcrumb-portal" />
        )}
      </div>

      {/* User menu */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="h-6 w-px bg-gray-200" />
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.name ?? user.email}</p>
          <p className="text-xs text-gray-400">{roleLabels[user.role] ?? user.role}</p>
        </div>

        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? "Avatar"}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {user.name ? getInitials(user.name) : <User size={14} />}
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}