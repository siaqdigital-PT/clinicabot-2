import { PrismaClient, AppointmentStatus, UserRole, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 A iniciar seed da base de dados...");

  // ─── SEGUROS ────────────────────────────────────────────────────────────────
  const insuranceNames = [
    "Médis",
    "AdvanceCare",
    "Fidelidade Saúde",
    "Multicare",
    "Lusíadas",
    "PT ACS",
    "Ageas",
    "GNB Seguros",
    "Ocidental",
    "SAMS",
    "ADSE",
    "SAD PSP",
    "SAD GNR",
  ];

  const insurances = await Promise.all(
    insuranceNames.map((name) =>
      prisma.insurance.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  console.log(`✅ ${insurances.length} seguros criados`);

  // ─── CLÍNICA DEMO ────────────────────────────────────────────────────────────
  const demoClinic = await prisma.clinic.upsert({
    where: { slug: "clinica-demo" },
    update: {},
    create: {
      name: "Clínica Demo",
      slug: "clinica-demo",
      address: "Rua da Demonstração, 1 — Lisboa",
      phone: "+351 210 000 000",
      email: "demo@clinicabot.pt",
      primaryColor: "#1D9E75",
      welcomeMessage: "Olá! Sou o assistente da Clínica Demo. Como posso ajudar?",
      plan: Plan.CLINIC,
      settings: {
        create: {
          chatbotPersonality: "friendly",
          reminderHoursBefore: 24,
          allowCancellation: true,
          cancellationHours: 2,
          maxBookingDaysAhead: 60,
        },
      },
    },
  });

  // Associar todos os seguros à clínica demo
  await prisma.clinicInsurance.createMany({
    data: insurances.map((ins) => ({
      clinicId: demoClinic.id,
      insuranceId: ins.id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Clínica demo criada: ${demoClinic.slug}`);

  // ─── ESPECIALIDADES ───────────────────────────────────────────────────────────
  const specialtyDefs = [
    { name: "Clínica Geral", durationMin: 20, color: "#4CAF50" },
    { name: "Cardiologia", durationMin: 45, color: "#F44336" },
    { name: "Dermatologia", durationMin: 30, color: "#FF9800" },
    { name: "Endocrinologia", durationMin: 40, color: "#9C27B0" },
    { name: "Gastroenterologia", durationMin: 40, color: "#795548" },
    { name: "Ginecologia", durationMin: 30, color: "#E91E63" },
    { name: "Neurologia", durationMin: 45, color: "#3F51B5" },
    { name: "Oftalmologia", durationMin: 30, color: "#00BCD4" },
    { name: "Ortopedia", durationMin: 30, color: "#FF5722" },
    { name: "Otorrinolaringologia", durationMin: 30, color: "#607D8B" },
    { name: "Pediatria", durationMin: 30, color: "#8BC34A" },
    { name: "Psicologia Clínica", durationMin: 50, color: "#673AB7" },
    { name: "Urologia", durationMin: 30, color: "#009688" },
  ];

  const specialties: Record<string, { id: string; durationMin: number }> = {};

  for (const def of specialtyDefs) {
    const s = await prisma.specialty.upsert({
      where: { clinicId_name: { clinicId: demoClinic.id, name: def.name } },
      update: {},
      create: {
        clinicId: demoClinic.id,
        name: def.name,
        durationMin: def.durationMin,
        color: def.color,
      },
    });
    specialties[def.name] = { id: s.id, durationMin: def.durationMin };
  }

  console.log(`✅ ${specialtyDefs.length} especialidades criadas`);

  // ─── MÉDICOS ──────────────────────────────────────────────────────────────────
  const doctorDefs = [
    {
      name: "Dra. Ana Silva",
      specialtyName: "Clínica Geral",
      email: "ana.silva@clinica-demo.pt",
      bio: "Médica de Medicina Geral e Familiar com 15 anos de experiência.",
    },
    {
      name: "Dr. Pedro Carvalho",
      specialtyName: "Cardiologia",
      email: "pedro.carvalho@clinica-demo.pt",
      bio: "Cardiologista especializado em doenças cardiovasculares.",
    },
    {
      name: "Dra. Mariana Costa",
      specialtyName: "Dermatologia",
      email: "mariana.costa@clinica-demo.pt",
      bio: "Dermatologista com especialização em dermatologia estética.",
    },
    {
      name: "Dr. João Ferreira",
      specialtyName: "Ortopedia",
      email: "joao.ferreira@clinica-demo.pt",
      bio: "Ortopedista especializado em cirurgia do joelho e anca.",
    },
    {
      name: "Dra. Sofia Mendes",
      specialtyName: "Pediatria",
      email: "sofia.mendes@clinica-demo.pt",
      bio: "Pediatra com vasta experiência em cuidados infantis.",
    },
    {
      name: "Dr. Rui Oliveira",
      specialtyName: "Neurologia",
      email: "rui.oliveira@clinica-demo.pt",
      bio: "Neurologista especializado em doenças neurodegenerativas.",
    },
    {
      name: "Dra. Catarina Lima",
      specialtyName: "Ginecologia",
      email: "catarina.lima@clinica-demo.pt",
      bio: "Ginecologista e obstetra com 12 anos de experiência.",
    },
    {
      name: "Dr. António Santos",
      specialtyName: "Psicologia Clínica",
      email: "antonio.santos@clinica-demo.pt",
      bio: "Psicólogo clínico especializado em terapia cognitivo-comportamental.",
    },
  ];

  const doctors: Record<string, string> = {};

  for (const def of doctorDefs) {
    const specialty = specialties[def.specialtyName];
    const d = await prisma.doctor.create({
      data: {
        clinicId: demoClinic.id,
        name: def.name,
        specialtyId: specialty?.id,
        email: def.email,
        bio: def.bio,
      },
    });
    doctors[def.name] = d.id;
  }

  console.log(`✅ ${doctorDefs.length} médicos criados`);

  // ─── DISPONIBILIDADES ────────────────────────────────────────────────────────
  const slots = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" },
    { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 5, startTime: "14:00", endTime: "17:00" },
  ];

  let availCount = 0;
  for (const [doctorName, doctorId] of Object.entries(doctors)) {
    const doctorSlots = slots.filter((_, i) => {
      const hash = (doctorName.charCodeAt(0) + i) % 3;
      return hash !== 0;
    });
    for (const slot of doctorSlots) {
      await prisma.availability.create({
        data: { clinicId: demoClinic.id, doctorId, ...slot },
      });
      availCount++;
    }
  }

  console.log(`✅ ${availCount} disponibilidades criadas`);

  // ─── MARCAÇÕES DE EXEMPLO ────────────────────────────────────────────────────
  const now = new Date();
  const doctorIds = Object.values(doctors);

  const sampleAppointments = [
    { daysOffset: 1, hour: 9, status: AppointmentStatus.CONFIRMED },
    { daysOffset: 1, hour: 10, status: AppointmentStatus.CONFIRMED },
    { daysOffset: 1, hour: 11, status: AppointmentStatus.PENDING },
    { daysOffset: 2, hour: 9, status: AppointmentStatus.CONFIRMED },
    { daysOffset: 2, hour: 14, status: AppointmentStatus.PENDING },
    { daysOffset: 3, hour: 10, status: AppointmentStatus.PENDING },
    { daysOffset: 5, hour: 9, status: AppointmentStatus.CONFIRMED },
    { daysOffset: 7, hour: 15, status: AppointmentStatus.PENDING },
    { daysOffset: 10, hour: 9, status: AppointmentStatus.CONFIRMED },
    { daysOffset: 14, hour: 11, status: AppointmentStatus.PENDING },
    { daysOffset: -1, hour: 9, status: AppointmentStatus.COMPLETED },
    { daysOffset: -1, hour: 10, status: AppointmentStatus.COMPLETED },
    { daysOffset: -2, hour: 14, status: AppointmentStatus.NO_SHOW },
    { daysOffset: -3, hour: 9, status: AppointmentStatus.COMPLETED },
    { daysOffset: -5, hour: 11, status: AppointmentStatus.CANCELLED },
    { daysOffset: -7, hour: 9, status: AppointmentStatus.COMPLETED },
    { daysOffset: -10, hour: 14, status: AppointmentStatus.COMPLETED },
    { daysOffset: -14, hour: 10, status: AppointmentStatus.CANCELLED },
    { daysOffset: -20, hour: 9, status: AppointmentStatus.COMPLETED },
    { daysOffset: -30, hour: 11, status: AppointmentStatus.COMPLETED },
  ];

  const patientNames = [
    "Maria João Rodrigues",
    "António Pereira",
    "Filipa Sousa",
    "Carlos Matos",
    "Beatriz Fernandes",
    "Miguel Lopes",
    "Teresa Martins",
    "Paulo Gonçalves",
    "Inês Ribeiro",
    "Ricardo Alves",
  ];

  for (let i = 0; i < sampleAppointments.length; i++) {
    const appt = sampleAppointments[i];
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + appt.daysOffset);
    scheduledAt.setHours(appt.hour, 0, 0, 0);

    const patientName = patientNames[i % patientNames.length];
    const doctorId = doctorIds[i % doctorIds.length];

    await prisma.appointment.create({
      data: {
        clinicId: demoClinic.id,
        doctorId,
        patientName,
        patientEmail: `${patientName.toLowerCase().replace(/\s+/g, ".")}@exemplo.pt`,
        patientPhone: `+351 9${Math.floor(10000000 + Math.random() * 90000000)}`,
        insuranceName: i % 3 === 0 ? "Médis" : i % 3 === 1 ? "ADSE" : undefined,
        scheduledAt,
        durationMin: 30,
        status: appt.status,
        cancelledAt: appt.status === AppointmentStatus.CANCELLED ? new Date(scheduledAt) : undefined,
        cancelReason: appt.status === AppointmentStatus.CANCELLED ? "Cancelado pelo paciente" : undefined,
        reminderSent: appt.daysOffset < 0,
      },
    });
  }

  console.log(`✅ ${sampleAppointments.length} marcações de exemplo criadas`);

  // ─── UTILIZADORES ────────────────────────────────────────────────────────────
  const hashedAdminPass = await bcrypt.hash("admin123", 12);
  const hashedDemoPass = await bcrypt.hash("demo123", 12);

  await prisma.user.upsert({
    where: { email: "admin@clinicabot.pt" },
    update: {},
    create: {
      email: "admin@clinicabot.pt",
      name: "Super Admin",
      password: hashedAdminPass,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@clinicabot.pt" },
    update: {},
    create: {
      email: "admin@clinica-demo.pt",
      name: "Admin Demo",
      password: hashedDemoPass,
      role: UserRole.CLINIC_ADMIN,
      clinicId: demoClinic.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "recepcao@clinica-demo.pt" },
    update: {},
    create: {
      email: "recepcao@clinica-demo.pt",
      name: "Receção Demo",
      password: await bcrypt.hash("recepcao123", 12),
      role: UserRole.RECEPTIONIST,
      clinicId: demoClinic.id,
    },
  });

  console.log("✅ 3 utilizadores criados");
  console.log("\n🎉 Seed concluído com sucesso!\n");
  console.log("  Credenciais de acesso:");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Super Admin  → admin@clinicabot.pt      / admin123");
  console.log("  Admin Demo   → admin@clinica-demo.pt    / demo123");
  console.log("  Receção      → recepcao@clinica-demo.pt / recepcao123");
  console.log("  ─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });