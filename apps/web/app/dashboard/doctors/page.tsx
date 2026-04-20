import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { DoctorsView } from "@/components/doctors/doctors-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Médicos" };

export default async function DoctorsPage() {
  const session = await auth();
  if (!session?.user.clinicId) return null;

  const [doctors, specialties] = await Promise.all([
    prisma.doctor.findMany({
      where: { clinicId: session.user.clinicId },
      include: {
        specialty: { select: { id: true, name: true, color: true } },
        availabilities: { where: { isActive: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.specialty.findMany({
      where: { clinicId: session.user.clinicId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Médicos</h1>
        <p className="text-sm text-gray-500">Gira os médicos e os seus horários</p>
      </div>
      <DoctorsView
        doctors={doctors.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          bio: d.bio,
          isActive: d.isActive,
          specialty: d.specialty,
          availabilityCount: d.availabilities.length,
        }))}
        specialties={specialties.map((s) => ({ id: s.id, name: s.name }))}
        clinicId={session.user.clinicId}
      />
    </div>
  );
}
