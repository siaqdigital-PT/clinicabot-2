"use client";

import { useState } from "react";

interface AccountFormProps {
  name: string;
  email: string;
  role: string;
}

export function AccountForm({ name, email, role }: AccountFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabel =
    role === "SUPER_ADMIN" ? "Super Administrador"
    : role === "CLINIC_ADMIN" ? "Administrador"
    : "Rececionista";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A nova password deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json() as { error?: string };

    if (!res.ok) {
      setError(json.error ?? "Erro ao alterar password.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <>
      {/* Informações da conta */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Informações</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Nome</p>
            <p className="text-sm text-gray-800">{name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Email</p>
            <p className="text-sm text-gray-800">{email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Função</p>
            <p className="text-sm text-gray-800">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Alterar password */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Alterar Password</h2>
        <p className="mb-5 text-sm text-gray-500">
          Escolha uma password segura com pelo menos 8 caracteres.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 max-w-md">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nova password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar nova password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repetir nova password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
              ✓ Password alterada com sucesso!
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "A guardar..." : "Guardar nova password"}
          </button>
        </form>
      </div>
    </>
  );
}