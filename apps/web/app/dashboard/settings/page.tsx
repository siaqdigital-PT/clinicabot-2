import { auth } from "@/auth";
import { prisma } from "@clinicabot/db";
import { SettingsForm } from "@/components/settings/settings-form";
import { EmbedSnippet } from "@/components/settings/embed-snippet";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Definições" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user.clinicId && session?.user.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-gray-500">Sem clínica associada.</p>;
  }

  const clinicId = session.user.clinicId ?? "";

  const [clinic, insurances, allInsurances] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { settings: true, insurances: { include: { insurance: true } } },
    }),
    prisma.clinicInsurance.findMany({
      where: { clinicId },
      include: { insurance: true },
    }),
    prisma.insurance.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!clinic) return <p className="text-sm text-gray-500">Clínica não encontrada.</p>;

  const selectedInsuranceIds = insurances.map((ci) => ci.insuranceId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Definições</h1>
        <p className="text-sm text-gray-500">Configure a sua clínica e o chatbot</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SettingsForm
            clinic={{
              id: clinic.id,
              name: clinic.name,
              slug: clinic.slug,
              address: clinic.address,
              phone: clinic.phone,
              email: clinic.email,
              website: clinic.website,
              primaryColor: clinic.primaryColor,
              welcomeMessage: clinic.welcomeMessage,
              settings: clinic.settings,
            }}
            allInsurances={allInsurances.map((i) => ({ id: i.id, name: i.name }))}
            selectedInsuranceIds={selectedInsuranceIds}
            isSuperAdmin={session.user.role === "SUPER_ADMIN"}
          />
        </div>

        <div className="space-y-6">
          <EmbedSnippet slug={clinic.slug} />
        </div>
      </div>
    </div>
  );
}
