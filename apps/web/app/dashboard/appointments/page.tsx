import type { Metadata } from "next";
import { AppointmentsView } from "@/components/appointments/appointments-view";

export const metadata: Metadata = { title: "Marcações" };

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marcações</h1>
        <p className="text-sm text-gray-500">Gira todas as consultas da clínica</p>
      </div>
      <AppointmentsView />
    </div>
  );
}
