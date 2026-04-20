"use client";

import { useState } from "react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    clinic: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Erro no envio");
      setStatus("sent");
      setFormData({ name: "", email: "", clinic: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]";

  return (
    <section id="contact" className="bg-gradient-to-br from-[#f0fdf8] to-white py-24">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Pronto para capturar as marcações que está a perder?
          </h2>
          <p className="mt-4 text-gray-500">
            Preencha o formulário e entraremos em contacto em 24 horas.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-12 text-center">
            <p className="mb-4 text-5xl">✓</p>
            <h3 className="text-xl font-semibold text-gray-900">Mensagem recebida!</h3>
            <p className="mt-2 text-gray-500">
              Entraremos em contacto nas próximas 24 horas. Obrigado pelo interesse no ClinicaBot!
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            {/* Nome + Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. João Silva"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="joao@clinica.pt"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Nome da clínica */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome da clínica <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.clinic}
                onChange={(e) => setFormData((p) => ({ ...p, clinic: e.target.value }))}
                placeholder="Clínica São João"
                className={inputCls}
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mensagem</label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                placeholder="Conte-nos um pouco sobre a sua clínica e o que precisa..."
                className={inputCls}
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-500">
                Erro ao enviar. Tente novamente ou contacte-nos em{" "}
                <a href="mailto:suporte@clinicabot.pt" className="underline">
                  suporte@clinicabot.pt
                </a>
                .
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15745a] disabled:opacity-60"
            >
              {status === "sending" ? "A enviar…" : "Enviar mensagem"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Sem spam. Sem compromisso. Respondemos sempre.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
