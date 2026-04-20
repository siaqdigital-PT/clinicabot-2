"use client";

import { useState } from "react";
import { Plus, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@clinicabot/utils";

interface Doctor {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  isActive: boolean;
  specialty: { id: string; name: string; color: string } | null;
  availabilityCount: number;
}

interface DoctorsViewProps {
  doctors: Doctor[];
  specialties: Array<{ id: string; name: string }>;
  clinicId: string;
}

export function DoctorsView({ doctors, specialties, clinicId }: DoctorsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function createDoctor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId, name, email, specialtyId: specialtyId || null, bio }),
    });
    setSaving(false);
    setShowForm(false);
    setName(""); setEmail(""); setSpecialtyId(""); setBio("");
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} /> Adicionar Médico
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <form
          onSubmit={createDoctor}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-4 text-base font-semibold text-gray-900">Novo Médico</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Especialidade</label>
              <select
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Sem especialidade</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Biografia</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "A guardar..." : "Criar Médico"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de médicos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {doctors.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <UserCircle size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Nenhum médico adicionado ainda</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <div
              key={doctor.id}
              className={cn(
                "rounded-xl border bg-white p-5 shadow-sm",
                doctor.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: doctor.specialty?.color ?? "#6b7280" }}
                >
                  {getInitials(doctor.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{doctor.name}</p>
                  {doctor.specialty && (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: doctor.specialty.color }}
                      />
                      <p className="text-xs text-gray-500">{doctor.specialty.name}</p>
                    </div>
                  )}
                  {doctor.email && (
                    <p className="mt-0.5 truncate text-xs text-gray-400">{doctor.email}</p>
                  )}
                </div>
              </div>

              {doctor.bio && (
                <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2">{doctor.bio}</p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">
                  {doctor.availabilityCount} slots de disponibilidade
                </p>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  doctor.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {doctor.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
