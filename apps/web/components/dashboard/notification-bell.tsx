"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  patientName: string;
  doctorName: string;
  specialtyName: string | null;
  scheduledAt: string;
  createdAt: string;
  isNew: boolean;
}

const LS_KEY = "cb_notif_seen_at";
const POLL_MS = 30_000;

function playBeep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") return; // sem interação do utilizador ainda

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    void ctx.close();
  } catch {}
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const prevUnseenRef = useRef<number | null>(null);
  const isFirstPollRef = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const since =
      localStorage.getItem(LS_KEY) ??
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      const res = await fetch(`/api/notifications?since=${encodeURIComponent(since)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: Notification[];
        unseenCount: number;
      };

      setNotifications(data.notifications);
      setUnseenCount(data.unseenCount);

      // Som apenas se chegaram novas notificações após o carregamento inicial
      if (
        !isFirstPollRef.current &&
        data.unseenCount > (prevUnseenRef.current ?? 0)
      ) {
        playBeep();
      }

      prevUnseenRef.current = data.unseenCount;
      isFirstPollRef.current = false;
    } catch {}
  }, []);

  // Polling + fetch inicial
  useEffect(() => {
    void fetchNotifications();
    const timer = setInterval(() => void fetchNotifications(), POLL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  function markAllRead() {
    const now = new Date().toISOString();
    localStorage.setItem(LS_KEY, now);
    setUnseenCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        title="Notificações"
        aria-label={`Notificações${unseenCount > 0 ? ` — ${unseenCount} novas` : ""}`}
      >
        <Bell size={18} />
        {unseenCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">Notificações</span>
            {unseenCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#1D9E75] hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                Sem marcações nas últimas 24h
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-gray-50 px-4 py-3 last:border-0 ${
                    n.isNew ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {n.patientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {n.specialtyName ?? `Dr. ${n.doctorName}`} às {fmtTime(n.scheduledAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {n.isNew && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          novo
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{fmtDate(n.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-[11px] text-gray-400">Atualiza de 30 em 30 segundos</p>
          </div>
        </div>
      )}
    </div>
  );
}
