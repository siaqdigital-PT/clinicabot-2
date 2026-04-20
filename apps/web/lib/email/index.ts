import { Resend } from "resend";
import { render } from "@react-email/components";
import { AppointmentConfirmationEmail } from "./templates/appointment-confirmation";
import { AppointmentReminderEmail } from "./templates/appointment-reminder";
import type { AppointmentEmailData } from "@clinicabot/types";
import { z } from "zod";

const resend = new Resend(
  z.string().min(1, "RESEND_API_KEY é obrigatória").parse(process.env.RESEND_API_KEY)
);

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@clinicabot.pt";

/** Envia email de confirmação ao paciente */
export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const html = await render(AppointmentConfirmationEmail(data));

  await resend.emails.send({
    from: `${data.clinicName} <${FROM}>`,
    to: data.patientEmail,
    subject: `Consulta confirmada — ${data.specialtyName} em ${data.clinicName}`,
    html,
  });
}

/** Envia lembrete 24h antes ao paciente */
export async function sendAppointmentReminder(data: AppointmentEmailData) {
  const html = await render(AppointmentReminderEmail(data));

  await resend.emails.send({
    from: `${data.clinicName} <${FROM}>`,
    to: data.patientEmail,
    subject: `Lembrete: Consulta amanhã na ${data.clinicName}`,
    html,
  });
}

/** Notifica a clínica quando uma nova marcação é criada via chatbot */
export async function sendClinicNotification(
  clinicEmail: string,
  data: {
    patientName: string;
    specialtyName: string;
    scheduledAt: Date;
    doctorName: string;
  }
) {
  if (!clinicEmail) return;

  await resend.emails.send({
    from: `ClinicaBot <${FROM}>`,
    to: clinicEmail,
    subject: `Nova marcação — ${data.specialtyName} via chatbot`,
    html: `
      <p>Uma nova marcação foi criada via chatbot:</p>
      <ul>
        <li><strong>Paciente:</strong> ${data.patientName}</li>
        <li><strong>Especialidade:</strong> ${data.specialtyName}</li>
        <li><strong>Médico:</strong> ${data.doctorName}</li>
        <li><strong>Data:</strong> ${data.scheduledAt.toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</li>
      </ul>
      <p>Aceda ao painel para ver os detalhes.</p>
    `,
  });
}

/** Envia email de cancelamento */
export async function sendCancellationEmail(
  patientEmail: string,
  data: {
    patientName: string;
    clinicName: string;
    clinicPhone: string;
    specialtyName: string;
    scheduledAt: Date;
  }
) {
  await resend.emails.send({
    from: `${data.clinicName} <${FROM}>`,
    to: patientEmail,
    subject: `Marcação cancelada — ${data.specialtyName}`,
    html: `
      <p>Olá ${data.patientName},</p>
      <p>A sua consulta de <strong>${data.specialtyName}</strong> marcada para
      <strong>${data.scheduledAt.toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</strong>
      foi cancelada.</p>
      <p>Se quiser remarcar, entre em contacto connosco pelo ${data.clinicPhone}
      ou use o nosso chatbot no website.</p>
      <p>Com os melhores cumprimentos,<br>${data.clinicName}</p>
    `,
  });
}
