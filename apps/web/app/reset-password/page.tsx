"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const json = await res.json() as { error?: string };

    if (!res.ok) {
      setError(json.error ?? "Erro ao redefinir password.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (!token || !email) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-sm">Link inválido ou expirado.</p>
        <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
      {success ? (
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-6 w-6 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Password redefinida!</h2>
          <p className="text-sm text-gray-500">A ser redirecionado para o login...</p>
        </div>
      ) : (
        <>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Nova password</h2>
          <p className="mb-6 text-sm text-gray-500">
            Define a nova password para <strong>{email}</strong>
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nova password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirmar password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetir password"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "A guardar..." : "Guardar nova password"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600">
              Voltar ao login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              <path d="M12 14v4M10 16h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ClinicaBot</h1>
          <p className="mt-1 text-sm text-gray-500">Redefinir Password</p>
        </div>

        <Suspense fallback={<div className="rounded-2xl bg-white p-8 shadow-xl">A carregar...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
