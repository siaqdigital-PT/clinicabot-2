"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const json = await res.json() as { error?: string };

    if (!res.ok) {
      setError(json.error ?? "Erro ao enviar email.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

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
          <p className="mt-1 text-sm text-gray-500">Recuperar Password</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Email enviado!</h2>
              <p className="text-sm text-gray-500">
                Se o endereço <strong>{email}</strong> existir na nossa base de dados,
                receberá um email com instruções para redefinir a password.
              </p>
              <p className="text-xs text-gray-400">
                Verifique também a pasta de spam. O link expira em 1 hora.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm text-primary hover:underline"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Esqueceu a password?</h2>
              <p className="mb-6 text-sm text-gray-500">
                Introduza o seu email e enviaremos um link para redefinir a password.
              </p>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@clinica.pt"
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
                  {loading ? "A enviar..." : "Enviar link de recuperação"}
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
      </div>
    </main>
  );
}
