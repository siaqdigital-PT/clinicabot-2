import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatAppointmentDate, formatDuration } from "@clinicabot/utils";
import type { AppointmentEmailData } from "@clinicabot/types";

/** Template de email de confirmação de marcação de consulta */
export function AppointmentConfirmationEmail({
  appointmentId,
  patientName,
  clinicName,
  clinicAddress,
  clinicPhone,
  doctorName,
  specialtyName,
  scheduledAt,
  durationMin,
  cancelToken,
  appUrl,
}: AppointmentEmailData) {
  const cancelUrl = `${appUrl}/cancel/${appointmentId}?token=${cancelToken}`;
  const dateFormatted = formatAppointmentDate(scheduledAt);
  const durationFormatted = formatDuration(durationMin);

  return (
    <Html lang="pt">
      <Head />
      <Preview>
        Consulta confirmada — {specialtyName} em {clinicName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>{clinicName}</Heading>
          </Section>

          {/* Conteúdo principal */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              A sua consulta está confirmada ✓
            </Heading>

            <Text style={greeting}>Olá, {patientName}!</Text>

            <Text style={text}>
              A sua marcação foi registada com sucesso. Aqui estão os detalhes:
            </Text>

            {/* Caixa com detalhes */}
            <Section style={detailsBox}>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <DetailRow label="Especialidade" value={specialtyName} />
                  <DetailRow label="Médico(a)" value={doctorName} />
                  <DetailRow label="Data e Hora" value={dateFormatted} highlight />
                  <DetailRow label="Duração" value={durationFormatted} />
                  <DetailRow label="Clínica" value={clinicName} />
                  <DetailRow label="Morada" value={clinicAddress} />
                  <DetailRow label="Telefone" value={clinicPhone} />
                </tbody>
              </table>
            </Section>

            <Text style={text}>
              Por favor, apareça 10 minutos antes da hora marcada. Se precisar de cancelar
              ou reagendar, pode fazê-lo até 2 horas antes da consulta.
            </Text>

            <Button style={cancelButton} href={cancelUrl}>
              Cancelar Marcação
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              Este email foi enviado automaticamente por {clinicName}.
              <br />
              Tem dúvidas? Contacte-nos em {clinicPhone}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <tr>
      <td style={detailLabel}>{label}:</td>
      <td style={highlight ? detailValueHighlight : detailValue}>{value}</td>
    </tr>
  );
}

// ─── Estilos inline (necessário para email clients) ───────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const header: React.CSSProperties = {
  backgroundColor: "#1D9E75",
  borderRadius: "8px 8px 0 0",
  padding: "24px 32px",
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "32px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const h2: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  marginTop: "0",
};

const greeting: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  marginBottom: "8px",
};

const text: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
};

const detailsBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "16px 20px",
  margin: "20px 0",
};

const detailLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "500",
  paddingBottom: "10px",
  paddingRight: "16px",
  width: "120px",
  verticalAlign: "top",
};

const detailValue: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  paddingBottom: "10px",
};

const detailValueHighlight: React.CSSProperties = {
  ...detailValue,
  color: "#1D9E75",
  fontWeight: "600",
};

const cancelButton: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "500",
  padding: "10px 20px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.5",
};
