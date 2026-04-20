"use client";

import { useState } from "react";

interface Props {
  appointmentId: string;
  cancelToken: string;
}

export function CancelConfirm({ appointmentId, cancelToken }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCancel() {
    setState("loading");
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Erro ao cancelar a marcação.");
        setState("error");
      }
    } catch {
      setErrorMsg("Erro de ligação. Tente novamente.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div style={successBox}>
        <span style={successIcon}>✓</span>
        <p style={successText}>Marcação cancelada com sucesso.</p>
        <p style={successSub}>Receberá uma confirmação por email.</p>
      </div>
    );
  }

  return (
    <div>
      {state === "error" && (
        <div style={errorBox}>
          <p style={errorText}>{errorMsg}</p>
        </div>
      )}
      <button
        onClick={() => void handleCancel()}
        disabled={state === "loading"}
        style={state === "loading" ? { ...cancelBtn, opacity: 0.6, cursor: "not-allowed" } : cancelBtn}
      >
        {state === "loading" ? "A cancelar…" : "Confirmar cancelamento"}
      </button>
    </div>
  );
}

const successBox: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #6ee7b7",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center",
};

const successIcon: React.CSSProperties = {
  display: "block",
  fontSize: "32px",
  color: "#059669",
  marginBottom: "8px",
};

const successText: React.CSSProperties = {
  color: "#065f46",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const successSub: React.CSSProperties = {
  color: "#047857",
  fontSize: "14px",
  margin: "0",
};

const errorBox: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "16px",
};

const errorText: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "14px",
  margin: "0",
};

const cancelBtn: React.CSSProperties = {
  backgroundColor: "#dc2626",
  border: "none",
  borderRadius: "8px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  width: "100%",
};
