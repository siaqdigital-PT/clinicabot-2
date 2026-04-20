import { format, addMinutes, parseISO, isValid } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { pt } from "date-fns/locale";

const CLINIC_TIMEZONE = "Europe/Lisbon";

// ─── Formatação de datas ──────────────────────────────────────────────────────

/**
 * Formata uma data para apresentação ao utilizador em português.
 * Ex: "segunda-feira, 14 de janeiro de 2025 às 10:00"
 */
export function formatAppointmentDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, CLINIC_TIMEZONE);
  return format(zoned, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });
}

/**
 * Formata uma data curta para uso no chatbot.
 * Ex: "Segunda, 14 Jan às 10:00"
 */
export function formatSlotShort(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, CLINIC_TIMEZONE);
  return format(zoned, "EEEE, d MMM 'às' HH:mm", { locale: pt });
}

/**
 * Converte uma hora (string "HH:mm") e um dia da semana para um Date completo
 * na próxima ocorrência desse dia.
 */
export function nextDayOfWeek(dayOfWeek: number, timeString: string): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CLINIC_TIMEZONE);
  const currentDay = zonedNow.getDay();

  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) daysUntil += 7;

  const [hours, minutes] = timeString.split(":").map(Number);
  const result = new Date(zonedNow);
  result.setDate(result.getDate() + daysUntil);
  result.setHours(hours, minutes, 0, 0);

  return fromZonedTime(result, CLINIC_TIMEZONE);
}

/**
 * Gera todos os slots de tempo entre startTime e endTime com intervalos de durationMin.
 * Ex: startTime="09:00", endTime="13:00", durationMin=30 → ["09:00", "09:30", ..., "12:30"]
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMin: number
): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: string[] = [];
  for (let m = startMinutes; m + durationMin <= endMinutes; m += durationMin) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }

  return slots;
}

/**
 * Combina uma data (YYYY-MM-DD) com uma hora (HH:mm) e converte para UTC Date.
 */
export function combineDateAndTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return fromZonedTime(localDate, CLINIC_TIMEZONE);
}

/**
 * Verifica se uma data é válida.
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date);
}

/**
 * Formata duração em minutos para string legível.
 * Ex: 90 → "1h 30min", 30 → "30 min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Geração de tokens ────────────────────────────────────────────────────────

/**
 * Gera um token aleatório seguro para cancelamento de marcações via email.
 */
export function generateCancelToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== "undefined") {
    crypto.getRandomValues(array);
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomBytes } = require("crypto");
    const bytes = randomBytes(32);
    return bytes.toString("hex");
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Formatação de texto ──────────────────────────────────────────────────────

/**
 * Trunca um texto para um número máximo de caracteres, adicionando "..." no fim.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Converte um nome de pessoa para iniciais.
 * Ex: "Maria João Rodrigues" → "MJR"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 3)
    .join("");
}

/**
 * Normaliza um slug: remove acentos, espaços → hífens, lowercase.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Validação ────────────────────────────────────────────────────────────────

/** Valida formato de email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida número de telefone português (9 dígitos, começado por 2, 3, 7, 9) */
export function isValidPortuguesePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s+\-().]/g, "");
  return /^((\+351)?[23789]\d{8})$/.test(cleaned);
}

// ─── Paginação ────────────────────────────────────────────────────────────────

/** Calcula offset e limit para queries paginadas */
export function getPaginationParams(
  page: number = 1,
  pageSize: number = 20
): { skip: number; take: number } {
  return {
    skip: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, pageSize)),
    take: Math.min(100, Math.max(1, pageSize)),
  };
}

// ─── Erros de API ─────────────────────────────────────────────────────────────

/** Cria um objeto de erro estruturado para respostas de API */
export function createApiError(message: string, code?: string) {
  return { error: message, code: code ?? "UNKNOWN_ERROR" };
}

/** Verifica se um erro é um erro de Prisma de registo não encontrado */
export function isPrismaNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}
