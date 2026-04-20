import React, { useState, useEffect, useCallback } from "react";
import { ChatWindow } from "./ChatWindow";
import { FloatingButton } from "./FloatingButton";

interface WidgetConfig {
  clinicId: string;
  clinicName: string;
  primaryColor: string;
  welcomeMessage: string;
  logoUrl: string | null;
  phone: string | null;
}

interface WidgetProps {
  clinicSlug: string;
  apiUrl: string;
}

// ─── Dark mode detection ───────────────────────────────────────────────────

function detectDarkMode(): boolean {
  const container = document.getElementById("clinicabot-widget") as HTMLElement | null;

  // 1. Forçado via data-theme no div do widget
  const forced = container?.dataset.theme;
  if (forced === "dark") return true;
  if (forced === "light") return false;

  // 2. data-theme no <html> ou <body>
  const htmlTheme = document.documentElement.dataset.theme;
  const bodyTheme = document.body?.dataset.theme;
  if (htmlTheme === "dark" || bodyTheme === "dark") return true;
  if (htmlTheme === "light" || bodyTheme === "light") return false;

  // 3. Classe "dark" ou "dark-mode" no <html> ou <body>
  const darkPattern = /\bdark(-mode)?\b/i;
  if (
    darkPattern.test(document.documentElement.className) ||
    darkPattern.test(document.body?.className ?? "")
  )
    return true;

  // 4. Preferência do sistema operativo
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// ─── Widget component ──────────────────────────────────────────────────────

export function Widget({ clinicSlug, apiUrl }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Persistir sessão entre recargas
  useEffect(() => {
    const stored = localStorage.getItem(`clinicabot_session_${clinicSlug}`);
    if (stored) setSessionToken(stored);
  }, [clinicSlug]);

  // Carregar configuração da clínica
  useEffect(() => {
    const url = `${apiUrl}/api/widget-config/${clinicSlug}`;
    fetch(url)
      .then((r) => r.json())
      .then((data: WidgetConfig) => setConfig(data))
      .catch((err) => console.error("[ClinicaBot] Erro ao carregar config:", err));
  }, [clinicSlug, apiUrl]);

  // Detetar dark mode e ouvir mudanças do sistema
  useEffect(() => {
    setIsDark(detectDarkMode());

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setIsDark(detectDarkMode());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSessionToken = useCallback(
    (token: string) => {
      setSessionToken(token);
      localStorage.setItem(`clinicabot_session_${clinicSlug}`, token);
    },
    [clinicSlug]
  );

  if (!config) return null;

  return (
    <>
      {/* Estilos inline para não depender de folha de estilos externa */}
      <style>{widgetStyles(config.primaryColor, isDark)}</style>

      {/* Janela de chat */}
      {isOpen && (
        <ChatWindow
          config={config}
          clinicSlug={clinicSlug}
          apiUrl={apiUrl}
          sessionToken={sessionToken}
          onSessionToken={handleSessionToken}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* Botão flutuante — mantém sempre a cor primária da clínica */}
      <FloatingButton
        primaryColor={config.primaryColor}
        isOpen={isOpen}
        onClick={() => setIsOpen((o) => !o)}
      />
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

function widgetStyles(primaryColor: string, isDark: boolean): string {
  // Valores das variáveis consoante o tema
  const v = isDark
    ? {
        bg: "#1a1a2e",
        bgSecondary: "#16213e",
        text: "#e0e0e0",
        textSecondary: "#a0a0a0",
        border: "#2a2a4a",
        inputBg: "#16213e",
        botBubble: "#222244",
        botText: "#e0e0e0",
      }
    : {
        bg: "#ffffff",
        bgSecondary: "#f5f5f5",
        text: "#1a1a1a",
        textSecondary: "#666666",
        border: "#e0e0e0",
        inputBg: "#ffffff",
        botBubble: "#f0f0f0",
        botText: "#1a1a1a",
      };

  return `
    .cb-widget {
      --cb-bg: ${v.bg};
      --cb-bg-secondary: ${v.bgSecondary};
      --cb-text: ${v.text};
      --cb-text-secondary: ${v.textSecondary};
      --cb-border: ${v.border};
      --cb-input-bg: ${v.inputBg};
      --cb-bot-bubble: ${v.botBubble};
      --cb-bot-text: ${v.botText};
    }
    .cb-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .cb-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      width: 60px; height: 60px; border-radius: 50%;
      background: ${primaryColor}; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.20);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      color: #fff;
    }
    .cb-fab:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
    .cb-window {
      position: fixed; bottom: 96px; right: 24px; z-index: 9999;
      width: 380px; height: 600px; border-radius: 16px;
      background: var(--cb-bg); box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex; flex-direction: column; overflow: hidden;
      animation: cb-slide-up 0.25s ease;
    }
    @media (max-width: 440px) {
      .cb-window { width: 100vw; height: 100vh; bottom: 0; right: 0; border-radius: 0; }
      .cb-fab { bottom: 16px; right: 16px; }
    }
    @keyframes cb-slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .cb-header {
      padding: 16px 16px 14px;
      background: ${primaryColor};
      color: #ffffff !important; display: flex; align-items: center; gap: 10px;
    }
    .cb-header, .cb-header * { color: #ffffff !important; }
    .cb-header-info { flex: 1; min-width: 0; }
    .cb-header-title { font-size: 15px; font-weight: 700; margin: 0; }
    .cb-header-sub { font-size: 11px; color: rgba(255,255,255,0.85) !important; margin: 2px 0 0; }
    .cb-close-btn {
      background: rgba(255,255,255,0.2); border: none; cursor: pointer;
      width: 28px; height: 28px; border-radius: 50%; color: #ffffff !important;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
      flex-shrink: 0;
    }
    .cb-close-btn:hover { background: rgba(255,255,255,0.35); }
    .cb-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
      background: var(--cb-bg-secondary);
    }
    .cb-msg { display: flex; flex-direction: column; max-width: 88%; }
    .cb-msg.cb-user { align-self: flex-end; align-items: flex-end; }
    .cb-msg.cb-bot  { align-self: flex-start; align-items: flex-start; }
    .cb-bubble {
      padding: 10px 14px; border-radius: 18px; font-size: 13.5px; line-height: 1.55;
      word-break: break-word;
    }
    .cb-msg.cb-user .cb-bubble { background: ${primaryColor}; color: #ffffff !important; border-bottom-right-radius: 4px; }
    .cb-msg.cb-bot  .cb-bubble { background: var(--cb-bot-bubble); color: var(--cb-bot-text); border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .cb-msg.cb-user .cb-bubble, .cb-msg.cb-user .cb-bubble * { color: #ffffff; }
    .cb-msg.cb-bot  .cb-bubble, .cb-msg.cb-bot  .cb-bubble * { color: var(--cb-bot-text); }
    .cb-bubble b, .cb-bubble strong { font-weight: 600; }
    .cb-bubble ul { margin: 6px 0; padding-left: 18px; }
    .cb-bubble li { margin: 3px 0; }
    .cb-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px; }
    .cb-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cb-text-secondary); }
    .cb-dot:nth-child(1) { animation: cb-bounce 1.2s ease-in-out infinite 0s; }
    .cb-dot:nth-child(2) { animation: cb-bounce 1.2s ease-in-out infinite 0.2s; }
    .cb-dot:nth-child(3) { animation: cb-bounce 1.2s ease-in-out infinite 0.4s; }
    @keyframes cb-bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }
    .cb-input-row {
      display: flex; gap: 8px; padding: 12px 14px;
      border-top: 1px solid var(--cb-border); background: var(--cb-bg);
    }
    .cb-input {
      flex: 1; border: 1.5px solid var(--cb-border); border-radius: 22px;
      padding: 9px 14px; font-size: 13.5px; outline: none; resize: none;
      max-height: 100px; overflow-y: auto;
      background: var(--cb-input-bg); color: var(--cb-text);
      transition: border-color 0.15s;
    }
    .cb-input::placeholder { color: var(--cb-text-secondary); }
    .cb-input:focus { border-color: ${primaryColor}; }
    .cb-send-btn {
      width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer;
      background: ${primaryColor}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; align-self: flex-end;
      transition: opacity 0.15s;
    }
    .cb-send-btn:disabled { opacity: 0.5; cursor: default; }
    .cb-send-btn:not(:disabled):hover { opacity: 0.88; }
    .cb-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: ${primaryColor}; color: #fff;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-bottom: 3px;
    }
    .cb-ts { font-size: 10px; color: var(--cb-text-secondary); margin-top: 3px; padding: 0 4px; }
    .cb-quick-replies {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; margin-left: 36px;
      animation: cb-fade-in 0.2s ease;
    }
    @keyframes cb-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .cb-quick-btn {
      border: 1.5px solid ${primaryColor}; background: transparent; color: ${primaryColor};
      border-radius: 20px; padding: 6px 14px; font-size: 12px; cursor: pointer;
      transition: background 0.2s, color 0.2s; font-family: inherit; line-height: 1;
    }
    .cb-quick-btn:hover:not(:disabled) { background: ${primaryColor}; color: #fff; }
    .cb-quick-btn:disabled { opacity: 0.5; cursor: default; }
    .cb-booking-card {
      margin-top: 8px; background: var(--cb-bg);
      border-left: 4px solid ${primaryColor};
      border-radius: 12px; padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      font-size: 12px; color: var(--cb-text);
      animation: cb-fade-in 0.25s ease;
    }
    .cb-booking-header {
      display: flex; align-items: center; gap: 6px;
      color: ${primaryColor}; font-weight: 700; font-size: 13px; margin-bottom: 6px;
    }
    .cb-booking-footer { color: var(--cb-text-secondary); font-size: 11px; margin-top: 8px; }
    .cb-typing-cursor::after {
      content: "▋";
      animation: cb-blink 0.7s infinite;
      color: ${primaryColor};
    }
    @keyframes cb-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
}
