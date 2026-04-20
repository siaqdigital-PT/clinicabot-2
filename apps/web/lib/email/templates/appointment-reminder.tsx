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
import { formatAppointmentDate } from "@clinicabot/utils";
import type { AppointmentEmailData } from "@clinicabot/types";

/** Template de email de lembrete 24h antes da consulta */
export function AppointmentReminderEmail({
  appointmentId,
  patientName,
  clinicName,
  clinicAddress,
  clinicPhone,
  doctorName,
  specialtyName,
  scheduledAt,
  cancelToken,
  appUrl,
}: AppointmentEmailData) {
  const cancelUrl = `${appUrl}/cancel/${appointmentId}?token=${cancelToken}`;
  const dateFormatted = formatAppointmentDate(scheduledAt);

  return (
    <Html lang="pt">
      <Head />
      <Preview>
        Lembrete: consulta de {specialtyName} amanhã em {clinicName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>{clinicName}</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>
              🔔 Lembrete de Consulta
            </Heading>

            <Text style={greeting}>Olá, {patientName}!</Text>

            <Text style={text}>
              Este é um lembrete da sua consulta marcada para <strong>amanhã</strong>:
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightText}>
                {specialtyName} • {dateFormatted}
              </Text>
              <Text style={highlightSub}>
                com {doctorName} na {clinicName}
              </Text>
              <Text style={highlightAddress}>{clinicAddress}</Text>
            </Section>

            <Text style={text}>
              Não se esqueça de trazer o seu cartão de cidadão e, se aplicável,
              o cartão do seguro de saúde.
            </Text>

            <Text style={text}>
              Se precisar de cancelar, pode fazê-lo até 2 horas antes da consulta.
            </Text>

            <Button style={cancelButton} href={cancelUrl}>
              Cancelar Marcação
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              Dúvidas? Contacte-nos pelo {clinicPhone}.
              <br />
              {clinicName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

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
};

const text: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
};

const highlightBox: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #6ee7b7",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const highlightText: React.CSSProperties = {
  color: "#065f46",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const highlightSub: React.CSSProperties = {
  color: "#047857",
  fontSize: "14px",
  margin: "0 0 4px",
};

const highlightAddress: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
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
