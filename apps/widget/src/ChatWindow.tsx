import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
  metadata?: { action?: string; appointmentId?: string } | null;
  isStreaming?: boolean;
}

interface QuickReply {
  label: string;
  message: string;
}

interface ChatWindowProps {
  config: {
    clinicName: string;
    primaryColor: string;
    welcomeMessage: string;
    logoUrl: string | null;
  };
  clinicSlug: string;
  apiUrl: string;
  sessionToken: string | null;
  onSessionToken: (token: string) => void;
  onClose: () => void;
}

const INITIAL_QUICK_REPLIES: QuickReply[] = [
  { label: "Marcar consulta", message: "Quero marcar uma consulta" },
  { label: "Ver especialidades", message: "Quais são as especialidades disponíveis?" },
  { label: "Informações da clínica", message: "Qual é a morada e horário da clínica?" },
];

export function ChatWindow({
  config,
  clinicSlug,
  apiUrl,
  sessionToken,
  onSessionToken,
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: config.welcomeMessage,
      timestamp: new Date(),
      quickReplies: INITIAL_QUICK_REPLIES,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usedReplies, setUsedReplies] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isTyping) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: msg, timestamp: new Date() },
    ]);
    setIsTyping(true);

    const botMsgId = `b-${Date.now()}`;
    let botMsgCreated = false;

    try {
      const res = await fetch(`${apiUrl}/api/chat/${clinicSlug}?stream=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ sessionToken, message: msg }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Cada evento SSE termina com \n\n
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          let event: {
            type: string;
            content?: string;
            message?: string;
            metadata?: { action?: string; appointmentId?: string } | null;
            sessionToken?: string;
          };

          try {
            event = JSON.parse(line.slice(6)) as typeof event;
          } catch {
            continue;
          }

          if (event.type === "text" && event.content) {
            if (!botMsgCreated) {
              // Primeira palavra: criar bolha e esconder o indicador de digitação
              botMsgCreated = true;
              setIsTyping(false);
              setMessages((prev) => [
                ...prev,
                {
                  id: botMsgId,
                  role: "bot",
                  content: event.content!,
                  timestamp: new Date(),
                  isStreaming: true,
                },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, content: m.content + event.content } : m
                )
              );
            }
          } else if (event.type === "done") {
            if (event.sessionToken) onSessionToken(event.sessionToken);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, isStreaming: false, metadata: event.metadata ?? null }
                  : m
              )
            );
            break outer;
          } else if (event.type === "error") {
            const errContent =
              "Ocorreu um erro. Por favor, tente novamente ou contacte a clínica directamente.";
            if (botMsgCreated) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, content: errContent, isStreaming: false } : m
                )
              );
            } else {
              setMessages((prev) => [
                ...prev,
                { id: botMsgId, role: "bot", content: errContent, timestamp: new Date() },
              ]);
            }
            break outer;
          }
        }
      }

      if (!botMsgCreated) throw new Error("Empty stream");
    } catch (err) {
      console.error("[ClinicaBot] Streaming falhou, a usar fallback:", err);

      // Fallback para resposta JSON normal
      try {
        const res = await fetch(`${apiUrl}/api/chat/${clinicSlug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken, message: msg }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as {
          sessionToken: string;
          message: string;
          metadata?: { action?: string; appointmentId?: string } | null;
        };

        if (data.sessionToken) onSessionToken(data.sessionToken);

        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            role: "bot",
            content: data.message || "Desculpe, ocorreu um erro. Tente novamente.",
            timestamp: new Date(),
            metadata: data.metadata ?? null,
          },
        ]);
      } catch (fallbackErr) {
        console.error("[ClinicaBot] Fallback falhou:", fallbackErr);
        if (!botMsgCreated) {
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              role: "bot",
              content:
                "Ocorreu um erro. Por favor, tente novamente ou contacte a clínica directamente.",
              timestamp: new Date(),
            },
          ]);
        }
      }
    } finally {
      setIsTyping(false);
      // Garantir que nenhuma mensagem fica em isStreaming=true
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, isStreaming: false } : m))
      );
      inputRef.current?.focus();
    }
  }

  function handleQuickReply(msgId: string, reply: QuickReply) {
    setUsedReplies((prev) => new Set([...prev, msgId]));
    void sendMessage(reply.message);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  const initials = config.clinicName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="cb-widget cb-window" role="dialog" aria-label={`Chat com ${config.clinicName}`}>
      {/* Header */}
      <div className="cb-header">
        {config.logoUrl ? (
          <img
            src={config.logoUrl}
            alt={config.clinicName}
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div className="cb-avatar">{initials}</div>
        )}
        <div className="cb-header-info">
          <p className="cb-header-title">{config.clinicName}</p>
          <p className="cb-header-sub">● Online agora</p>
        </div>
        <button className="cb-close-btn" onClick={onClose} aria-label="Fechar chat">
          ✕
        </button>
      </div>

      {/* Mensagens */}
      <div className="cb-messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            <MessageBubble msg={msg} initials={initials} />
            {msg.role === "bot" && msg.quickReplies && !usedReplies.has(msg.id) && (
              <div className="cb-quick-replies">
                {msg.quickReplies.map((reply) => (
                  <button
                    key={reply.label}
                    className="cb-quick-btn"
                    onClick={() => handleQuickReply(msg.id, reply)}
                    disabled={isTyping}
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Indicador de digitação (enquanto espera a primeira palavra) */}
        {isTyping && (
          <div className="cb-msg cb-bot">
            <div className="cb-avatar">{initials}</div>
            <div className="cb-bubble cb-typing">
              <div className="cb-dot" />
              <div className="cb-dot" />
              <div className="cb-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="cb-input-row">
        <textarea
          ref={inputRef}
          className="cb-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem..."
          rows={1}
          disabled={isTyping}
          aria-label="Mensagem"
        />
        <button
          className="cb-send-btn"
          onClick={() => void sendMessage()}
          disabled={!input.trim() || isTyping}
          aria-label="Enviar mensagem"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Converte markdown simples em JSX (negrito, listas) */
function parseContent(text: string): React.ReactNode {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const listItems: string[] = [line.slice(2)];
      while (
        i + 1 < lines.length &&
        (lines[i + 1].startsWith("- ") || lines[i + 1].startsWith("• "))
      ) {
        i++;
        listItems.push(lines[i].slice(2));
      }
      result.push(
        <ul key={i}>
          {listItems.map((item, j) => (
            <li key={j}>{parseLine(item)}</li>
          ))}
        </ul>
      );
    } else if (line) {
      result.push(
        <p key={i} style={{ margin: "0 0 4px" }}>
          {parseLine(line)}
        </p>
      );
    }
  }

  return result;
}

/** Converte **negrito** e *itálico* numa linha */
function parseLine(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg, initials }: { msg: Message; initials: string }) {
  const isBooking =
    msg.metadata != null &&
    msg.metadata.action === "booking_created" &&
    !msg.content.toLowerCase().includes("erro");

  return (
    <div className={`cb-msg cb-${msg.role}`}>
      {msg.role === "bot" && <div className="cb-avatar">{initials}</div>}
      <div>
        <div className={`cb-bubble${msg.isStreaming ? " cb-streaming" : ""}`}>
          {parseContent(msg.content)}
          {msg.isStreaming && <span className="cb-typing-cursor" aria-hidden="true" />}
        </div>
        {isBooking && (
          <div className="cb-booking-card">
            <div className="cb-booking-header">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              Marcação confirmada
            </div>
            <div className="cb-booking-footer">
              Vai receber um email de confirmação em breve.
            </div>
          </div>
        )}
      </div>
      <span className="cb-ts">{formatTime(msg.timestamp)}</span>
    </div>
  );
}
