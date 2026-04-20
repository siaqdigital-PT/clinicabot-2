"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  patientName: string | null;
  patientEmail: string | null;
  lastActiveAt: string;
  createdAt: string;
  messageCount: number;
  lastMessage: { content: string; role: string; createdAt: string } | null;
  hasAppointment: boolean;
}

interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

interface AppointmentRef {
  id: string;
  patientName: string;
  scheduledAt: string;
  status: string;
  specialtyName: string | null;
}

interface SessionDetail {
  id: string;
  patientName: string | null;
  patientEmail: string | null;
  createdAt: string;
  lastActiveAt: string;
  appointments: AppointmentRef[];
}

interface SessionsResponse {
  sessions: SessionSummary[];
  total: number;
  withAppointment: number;
}

interface MessagesResponse {
  session: SessionDetail;
  messages: Message[];
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `há ${diffD} dias`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChatMonitorPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [withAppointment, setWithAppointment] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Fetch sessões ───────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/chat-sessions${params}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as SessionsResponse;
      setSessions(data.sessions);
      setTotal(data.total);
      setWithAppointment(data.withAppointment);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void fetchSessions(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchSessions]);

  // ─── Fetch mensagens ─────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (id: string) => {
    setLoadingMessages(true);
    setMessages([]);
    setDetail(null);
    try {
      const res = await fetch(`/api/chat-sessions/${id}/messages`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as MessagesResponse;
      setDetail(data.session);
      setMessages(data.messages);
    } catch {
      // silencioso
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  // Auto-scroll ao selecionar conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const conversionRate =
    total > 0 ? Math.round((withAppointment / total) * 100) : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      {/* Cabeçalho + stats */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Monitor de Conversas</h1>
          <p className="text-sm text-gray-500">Histórico de todas as sessões de chat</p>
        </div>
        <div className="flex gap-3">
          <StatCard label="Total de conversas" value={total} />
          <StatCard
            label="Taxa de conversão"
            value={`${conversionRate}%`}
            sub={`${withAppointment} com marcação`}
            highlight={conversionRate > 0}
          />
        </div>
      </div>

      {/* Painel principal (dois colunas) */}
      <div className="flex flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Coluna esquerda: lista de sessões ── */}
        <div className="flex w-1/3 min-w-0 flex-col border-r border-gray-200">
          {/* Pesquisa */}
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar paciente..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Spinner /> <span className="ml-2 text-sm">A carregar...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ChatIcon className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  selected={selectedId === s.id}
                  onClick={() => setSelectedId(s.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Coluna direita: detalhes da conversa ── */}
        <div className="flex flex-1 flex-col">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
              <ChatIcon className="mb-3 h-12 w-12 text-gray-200" />
              <p className="font-medium">Selecciona uma conversa</p>
              <p className="text-sm">Clica numa sessão para ver o histórico</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da conversa */}
              {detail && (
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {detail.patientName ?? "Visitante anónimo"}
                    </p>
                    {detail.patientEmail && (
                      <p className="text-xs text-gray-500">{detail.patientEmail}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {detail.appointments.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                        <CheckIcon className="h-3 w-3" />
                        Marcação criada
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatDateFull(detail.createdAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Marcações associadas */}
              {detail && detail.appointments.length > 0 && (
                <div className="border-b border-gray-100 bg-emerald-50 px-5 py-2">
                  {detail.appointments.map((a) => (
                    <p key={a.id} className="text-xs text-emerald-700">
                      <span className="font-medium">{a.specialtyName ?? "Consulta"}</span>
                      {" — "}
                      {new Date(a.scheduledAt).toLocaleString("pt-PT", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600">
                        {a.status}
                      </span>
                    </p>
                  ))}
                </div>
              )}

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <Spinner /> <span className="ml-2 text-sm">A carregar mensagens...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">Sem mensagens</p>
                ) : (
                  messages.map((m, i) => {
                    const isUser = m.role === "USER";
                    const showTime =
                      i === 0 ||
                      new Date(m.createdAt).getTime() -
                        new Date(messages[i - 1]!.createdAt).getTime() >
                        5 * 60_000;

                    return (
                      <React.Fragment key={m.id}>
                        {showTime && (
                          <p className="text-center text-[10px] text-gray-400 select-none">
                            {formatTime(m.createdAt)}
                          </p>
                        )}
                        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          {!isUser && (
                            <div className="mr-2 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1D9E75] text-[10px] font-bold text-white">
                              B
                            </div>
                          )}
                          <div
                            className={`max-w-[72%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                              isUser
                                ? "rounded-br-sm bg-[#1D9E75] text-white"
                                : "rounded-bl-sm bg-gray-100 text-gray-800"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function SessionRow({
  session: s,
  selected,
  onClick,
}: {
  session: SessionSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        selected ? "bg-emerald-50 hover:bg-emerald-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`truncate text-sm font-medium ${selected ? "text-emerald-800" : "text-gray-900"}`}>
          {s.patientName ?? "Visitante anónimo"}
        </p>
        <span className="flex-shrink-0 text-[10px] text-gray-400">
          {formatRelative(s.lastActiveAt)}
        </span>
      </div>
      {s.lastMessage && (
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {s.lastMessage.role === "USER" ? "" : "Bot: "}
          {truncate(s.lastMessage.content, 55)}
        </p>
      )}
      <div className="mt-1.5 flex items-center gap-2">
        {s.hasAppointment && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            <CheckIcon className="h-2.5 w-2.5" />
            Marcação
          </span>
        )}
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
          {s.messageCount} msg
        </span>
      </div>
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-right shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-[#1D9E75]" : "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Ícones SVG inline ─────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
