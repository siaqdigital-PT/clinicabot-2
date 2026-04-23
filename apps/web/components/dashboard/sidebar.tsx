"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  MessageSquare,
  Settings,
  BarChart3,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    name?: string | null;
    role: string;
    clinic: { name: string; primaryColor: string } | null;
  };
}

const clinicNavItems = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/appointments", label: "Marcações", icon: Calendar },
  { href: "/dashboard/doctors", label: "Médicos", icon: Stethoscope },
  { href: "/dashboard/specialties", label: "Especialidades", icon: Users },
  { href: "/dashboard/chat", label: "Conversas", icon: MessageSquare },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Definições", icon: Settings },
  { href: "/dashboard/account", label: "A minha conta", icon: UserCircle },
];

const superAdminNavItems = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin", label: "Administração", icon: ShieldCheck },
  { href: "/dashboard/account", label: "A minha conta", icon: UserCircle },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const navItems = isSuperAdmin ? superAdminNavItems : clinicNavItems;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: user.clinic?.primaryColor ?? "#1D9E75" }}
        >
          <Calendar size={16} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {isSuperAdmin ? "ClinicaBot" : (user.clinic?.name ?? "ClinicaBot")}
          </p>
          <p className="text-xs text-gray-400">
            {isSuperAdmin ? "Super Administrador" : "Painel de Gestão"}
          </p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-2">
          {isSuperAdmin && (
            <li className="mb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Super Admin
              </p>
            </li>
          )}
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Versão */}
      <div className="border-t border-gray-200 px-5 py-3">
        <p className="text-xs text-gray-400">ClinicaBot v0.1.0</p>
      </div>
    </aside>
  );
}