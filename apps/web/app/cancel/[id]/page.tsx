import { prisma } from "@clinicabot/db";
import { formatAppointmentDate } from "@clinicabot/utils";
import { CancelConfirm } from "./cancel-confirm";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
  searchParams: { token?: string };
}

// ─── Componente de erro ────────────────────────────────────────────────────────

function ErrorView({ clinicColor, message, sub }: { clinicColor?: string; message: string; sub?: string }) {
  return (
    <main style={pageWrap}>
      <div style={card}>
        <div style={{ ...header, backgroundColor: clinicColor ?? "#1D9E75" }}>
          <p style={clinicTitle}>ClinicaBot</p>
        </div>
        <div style={body}>
          <div style={errorBox}>
            <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>✕</span>
            <p style={errorTitle}>{message}</p>
            {sub && <p style={errorSub}>{sub}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Página principal (server component) ─────────────────────────────────────

export default async function CancelPage({ params, searchParams }: Props) {
  const token = searchParams.token ?? "";

  if (!token) {
    return <ErrorView message="Link inválido." sub="Este link de cancelamento não é válido." />;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      clinic: {
        select: {
          name: true,
          address: true,
          phone: true,
          primaryColor: true,
          settings: {
            select: { cancellationHours: true, allowCancellation: true },
          },
        },
      },
      doctor: {
        select: {
          name: true,
          specialty: { select: { name: true } },
        },
      },
    },
  });

  // Token inválido ou marcação não encontrada
  if (!appointment || appointment.cancelToken !== token) {
    return (
      <ErrorView
        message="Link inválido ou expirado."
        sub="Verifique se o link está correcto ou contacte a clínica."
      />
    );
  }

  const clinicColor = appointment.clinic.primaryColor;
  const clinicName = appointment.clinic.name;

  // Já cancelada
  if (appointment.status === "CANCELLED") {
    return (
      <ErrorView
        clinicColor={clinicColor}
        message="Marcação já cancelada."
        sub="Esta marcação já foi cancelada anteriormente."
      />
    );
  }

  // Verificar janela de cancelamento
  const settings = appointment.clinic.settings;
  const cancellationHours = settings?.cancellationHours ?? 2;
  const allowCancellation = settings?.allowCancellation !== false;
  const deadline = new Date(
    appointment.scheduledAt.getTime() - cancellationHours * 60 * 60 * 1000
  );
  const isTooLate = !allowCancellation || new Date() > deadline;

  const specialtyName = appointment.doctor.specialty?.name ?? "Consulta";
  const dateFormatted = formatAppointmentDate(appointment.scheduledAt);

  return (
    <main style={pageWrap}>
      <div style={card}>
        {/* Cabeçalho com cor da clínica */}
        <div style={{ ...header, backgroundColor: clinicColor }}>
          <p style={clinicTitle}>{clinicName}</p>
        </div>

        {/* Conteúdo */}
        <div style={body}>
          <h1 style={title}>Cancelar Marcação</h1>
          <p style={subtitle}>
            Confirme que pretende cancelar a seguinte consulta:
          </p>

          {/* Detalhes da marcação */}
          <div style={detailsBox}>
            <DetailRow label="Especialidade" value={specialtyName} />
            <DetailRow label="Data e hora" value={dateFormatted} highlight />
            <DetailRow label="Médico(a)" value={appointment.doctor.name} />
            {appointment.clinic.address && (
              <DetailRow label="Local" value={appointment.clinic.address} />
            )}
          </div>

          {isTooLate ? (
            <div style={warningBox}>
              <p style={warningTitle}>Cancelamento não permitido</p>
              <p style={warningText}>
                {allowCancellation
                  ? `Não é possível cancelar com menos de ${cancellationHours}h de antecedência. Por favor, contacte a clínica directamente.`
                  : "Esta clínica não permite cancelamentos online. Por favor contacte-nos directamente."}
              </p>
              {appointment.clinic.phone && (
                <p style={warningPhone}>
                  Telefone:{" "}
                  <a href={`tel:${appointment.clinic.phone}`} style={{ color: "#92400e" }}>
                    {appointment.clinic.phone}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <>
              <p style={warningCancel}>
                Esta acção não pode ser desfeita. Se não puder comparecer, por favor cancele
                com antecedência para que possamos disponibilizar o horário a outros pacientes.
              </p>
              <CancelConfirm appointmentId={params.id} cancelToken={token} />
            </>
          )}
        </div>

        {/* Rodapé */}
        <div style={footer}>
          <p style={footerText}>{clinicName}</p>
          {appointment.clinic.phone && (
            <p style={footerText}>{appointment.clinic.phone}</p>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={detailRow}>
      <span style={detailLabel}>{label}</span>
      <span style={highlight ? detailValueHL : detailValue}>{value}</span>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  maxWidth: "480px",
  width: "100%",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  padding: "24px 28px",
};

const clinicTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
};

const body: React.CSSProperties = {
  padding: "28px",
};

const title: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const subtitle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 20px",
};

const detailsBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px 20px",
  marginBottom: "20px",
};

const detailRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "10px",
};

const detailLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  flexShrink: 0,
};

const detailValue: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: "500",
  textAlign: "right",
};

const detailValueHL: React.CSSProperties = {
  ...detailValue,
  color: "#1D9E75",
  fontWeight: "700",
};

const warningBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fcd34d",
  borderRadius: "10px",
  padding: "16px 20px",
};

const warningTitle: React.CSSProperties = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 6px",
};

const warningText: React.CSSProperties = {
  color: "#92400e",
  fontSize: "13px",
  margin: "0",
  lineHeight: "1.5",
};

const warningPhone: React.CSSProperties = {
  color: "#92400e",
  fontSize: "13px",
  marginTop: "8px",
  marginBottom: "0",
};

const warningCancel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.6",
  marginBottom: "20px",
};

const errorBox: React.CSSProperties = {
  textAlign: "center",
  padding: "16px 0",
};

const errorTitle: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 6px",
};

const errorSub: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
};

const footer: React.CSSProperties = {
  borderTop: "1px solid #f3f4f6",
  padding: "14px 28px",
  backgroundColor: "#fafafa",
};

const footerText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "2px 0",
};
