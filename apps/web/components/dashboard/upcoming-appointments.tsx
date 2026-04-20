import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patientName: string;
  specialtyName: string;
  doctorName: string;
  scheduledAt: string;
  color: string;
  status: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Pendente", class: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmada", class: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", class: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Concluída", class: "bg-gray-100 text-gray-600" },
  NO_SHOW: { label: "Falta", class: "bg-orange-100 text-orange-700" },
};

export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-gray-400">Sem marcações nas próximas 48 horas</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {appointments.map((appt) => {
        const s = statusLabels[appt.status] ?? statusLabels.PENDING;
        return (
          <li
            key={appt.id}
            className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
          >
            {/* Indicador de cor da especialidade */}
            <div
              className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: appt.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-900">{appt.patientName}</p>
                <span className={cn("flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", s.class)}>
                  {s.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {appt.specialtyName} · Dr. {appt.doctorName}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{appt.scheduledAt}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
