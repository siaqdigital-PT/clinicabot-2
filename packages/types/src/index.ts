// ─── Tipos de API ─────────────────────────────────────────────────────────────

/** Configuração pública do widget (retornada pelo endpoint /api/widget-config/:slug) */
export interface WidgetConfig {
  clinicId: string;
  clinicName: string;
  slug: string;
  primaryColor: string;
  welcomeMessage: string;
  logoUrl: string | null;
  phone: string | null;
}

/** Slot de disponibilidade para apresentar no chatbot */
export interface AvailabilitySlot {
  doctorId: string;
  doctorName: string;
  specialtyName: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  durationMin: number;
}

/** Payload para criar marcação via chatbot ou painel */
export interface CreateAppointmentInput {
  clinicId: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  specialtyName: string;
  scheduledAt: string; // ISO 8601
  durationMin?: number;
  insuranceName?: string;
  notes?: string;
  chatSessionId?: string;
}

/** Resposta de marcação criada */
export interface AppointmentResponse {
  id: string;
  clinicId: string;
  doctorId: string;
  doctorName: string;
  specialtyName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  insuranceName: string | null;
  scheduledAt: string;
  durationMin: number;
  status: AppointmentStatus;
  cancelToken: string | null;
  createdAt: string;
}

// ─── Enums partilhados ────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type UserRole = "SUPER_ADMIN" | "CLINIC_ADMIN" | "RECEPTIONIST";

export type Plan = "PILOT" | "STARTER" | "CLINIC" | "ENTERPRISE";

export type ChatbotPersonality = "professional" | "friendly" | "formal";

// ─── Tipos do chatbot ─────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Argumentos da tool check_availability chamada pelo Grok */
export interface CheckAvailabilityArgs {
  specialtyName: string;
  preferredDate?: string; // YYYY-MM-DD
}

/** Argumentos da tool create_appointment chamada pelo Grok */
export interface CreateAppointmentArgs {
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  specialtyName: string;
  doctorId: string;
  scheduledAt: string; // ISO 8601
  insuranceName?: string;
  notes?: string;
}

// ─── Tipos do painel de administração ────────────────────────────────────────

export interface DashboardStats {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  occupancyRate: number; // 0-100
  noShowRate: number;    // 0-100
  chatConversionRate: number; // 0-100
  totalActivePatients: number;
}

export interface MonthlyReport {
  month: string; // "2024-01"
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  bySpecialty: Record<string, number>;
}

// ─── Tipos de email ───────────────────────────────────────────────────────────

export interface AppointmentEmailData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  doctorName: string;
  specialtyName: string;
  scheduledAt: Date;
  durationMin: number;
  cancelToken: string;
  appUrl: string;
}

// ─── Tipos de paginação ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ─── Tipos de filtros ─────────────────────────────────────────────────────────

export interface AppointmentFilters extends PaginationParams {
  clinicId?: string;
  doctorId?: string;
  specialtyId?: string;
  status?: AppointmentStatus;
  from?: string; // ISO 8601 date
  to?: string;   // ISO 8601 date
  search?: string; // pesquisa por nome/email do paciente
}
