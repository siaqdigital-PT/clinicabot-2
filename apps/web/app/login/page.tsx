import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Aceda ao painel de gestão da sua clínica.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <path d="M12 14v4M10 16h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ClinicaBot</h1>
          <p className="mt-1 text-sm text-gray-500">Painel de Gestão</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-gray-400">
          Precisa de ajuda? <a href="mailto:suporte@clinicabot.pt" className="text-primary hover:underline">suporte@clinicabot.pt</a>
        </p>
      </div>
    </main>
  );
}
