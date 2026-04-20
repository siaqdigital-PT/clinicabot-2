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
    where: { slug: "demo" },
    update: {},
    create: {
      name: "ClinicaBot Demo",
      slug: "demo",
      address: "Rua da Demonstração, 1 — Lisboa",
      phone: "+351 210 000 000",
      email: "demo@clinicabot.pt",
      primaryColor: "#1D9E75",
      welcomeMessage: "Olá! Sou o assistente da ClinicaBot Demo. Como posso ajudar?",
      plan: Plan.PILOT,
      settings: {
        create: {
          chatbotPersonality: "friendly",
          reminderHoursBefore: 24,
          allowCancellation: true,
          cancellationHours: 2,
          maxBookingDaysAhead: 30,
        },
      },
    },
  });

  // Associar alguns seguros à demo
  await prisma.clinicInsurance.createMany({
    data: [insurances[0], insurances[1], insurances[2]].map((ins) => ({
      clinicId: demoClinic.id,
      insuranceId: ins.id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Clínica demo criada: ${demoClinic.slug}`);

  // ─── POLIVI ──────────────────────────────────────────────────────────────────
  const polivi = await prisma.clinic.upsert({
    where: { slug: "polivi" },
    update: {},
    create: {
      name: "Polivi — Policlínica de Viana do Castelo",
      slug: "polivi",
      address: "Rua Gago Coutinho, 48 — 4900-480 Viana do Castelo",
      phone: "+351 258 000 000",
      email: "geral@polivi.pt",
      website: "https://polivi.pt",
      primaryColor: "#0057A8",
      welcomeMessage: "Bem-vindo à Polivi! Estou aqui para o ajudar a marcar a sua consulta.",
      plan: Plan.CLINIC,
      settings: {
        create: {
          chatbotPersonality: "professional",
          reminderHoursBefore: 24,
          allowCancellation: true,
          cancellationHours: 2,
          maxBookingDaysAhead: 60,
          aiSystemPrompt:
            "És o assistente virtual da Polivi — Policlínica de Viana do Castelo. Apresenta-te sempre como 'Assistente Polivi'. O teu tom é profissional, empático e eficiente. Ajudas os pacientes a marcar consultas nas diversas especialidades da clínica.",
        },
      },
    },
  });

  // Associar todos os seguros à Polivi
  await prisma.clinicInsurance.createMany({
    data: insurances.map((ins) => ({
      clinicId: polivi.id,
      insuranceId: ins.id,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Clínica Polivi criada: ${polivi.slug}`);

  // ─── ESPECIALIDADES POLIVI ───────────────────────────────────────────────────
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
      where: { clinicId_name: { clinicId: polivi.id, name: def.name } },
      update: {},
      create: {
        clinicId: polivi.id,
        name: def.name,
        durationMin: def.durationMin,
        color: def.color,
      },
    });
    specialties[def.name] = { id: s.id, durationMin: def.durationMin };
  }

  console.log(`✅ ${specialtyDefs.length} especialidades criadas para a Polivi`);

  // ─── MÉDICOS POLIVI ──────────────────────────────────────────────────────────
  const doctorDefs = [
    {
      name: "Dra. Ana Silva",
      specialtyName: "Clínica Geral",
      email: "ana.silva@polivi.pt",
      bio: "Médica de Medicina Geral e Familiar com 15 anos de experiência.",
    },
    {
      name: "Dr. Pedro Carvalho",
      specialtyName: "Cardiologia",
      email: "pedro.carvalho@polivi.pt",
      bio: "Cardiologista especializado em doenças cardiovasculares.",
    },
    {
      name: "Dra. Mariana Costa",
      specialtyName: "Dermatologia",
      email: "mariana.costa@polivi.pt",
      bio: "Dermatologista com especialização em dermatologia estética.",
    },
    {
      name: "Dr. João Ferreira",
      specialtyName: "Ortopedia",
      email: "joao.ferreira@polivi.pt",
      bio: "Ortopedista especializado em cirurgia do joelho e anca.",
    },
    {
      name: "Dra. Sofia Mendes",
      specialtyName: "Pediatria",
      email: "sofia.mendes@polivi.pt",
      bio: "Pediatra com vasta experiência em cuidados infantis.",
    },
    {
      name: "Dr. Rui Oliveira",
      specialtyName: "Neurologia",
      email: "rui.oliveira@polivi.pt",
      bio: "Neurologista especializado em doenças neurodegenerativas.",
    },
    {
      name: "Dra. Catarina Lima",
      specialtyName: "Ginecologia",
      email: "catarina.lima@polivi.pt",
      bio: "Ginecologista e obstetra com 12 anos de experiência.",
    },
    {
      name: "Dr. António Santos",
      specialtyName: "Psicologia Clínica",
      email: "antonio.santos@polivi.pt",
      bio: "Psicólogo clínico especializado em terapia cognitivo-comportamental.",
    },
  ];

  const doctors: Record<string, string> = {}; // name -> id

  for (const def of doctorDefs) {
    const specialty = specialties[def.specialtyName];
    const d = await prisma.doctor.create({
      data: {
        clinicId: polivi.id,
        name: def.name,
        specialtyId: specialty?.id,
        email: def.email,
        bio: def.bio,
      },
    });
    doctors[def.name] = d.id;
  }

  console.log(`✅ ${doctorDefs.length} médicos criados para a Polivi`);

  // ─── DISPONIBILIDADES ────────────────────────────────────────────────────────
  // Seg-Sex, manhã (9h-13h) + tarde (14h-18h) para todos os médicos
  const slots = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "13:00" }, // Seg manhã
    { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" }, // Seg tarde
    { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" }, // Ter manhã
    { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" }, // Ter tarde
    { dayOfWeek: 3, startTime: "09:00", endTime: "13:00" }, // Qua manhã
    { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" }, // Qua tarde
    { dayOfWeek: 4, startTime: "09:00", endTime: "13:00" }, // Qui manhã
    { dayOfWeek: 4, startTime: "14:00", endTime: "18:00" }, // Qui tarde
    { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" }, // Sex manhã
    { dayOfWeek: 5, startTime: "14:00", endTime: "17:00" }, // Sex tarde (termina 17h)
  ];

  // Cada médico tem disponibilidade em 4-6 slots aleatórios (realista)
  let availCount = 0;
  for (const [doctorName, doctorId] of Object.entries(doctors)) {
    // Selecionar slots variados por médico (simula horários diferentes)
    const doctorSlots = slots.filter((_, i) => {
      const hash = (doctorName.charCodeAt(0) + i) % 3;
      return hash !== 0; // elimina ~33% dos slots para variedade
    });

    for (const slot of doctorSlots) {
      await prisma.availability.create({
        data: {
          clinicId: polivi.id,
          doctorId,
          ...slot,
        },
      });
      availCount++;
    }
  }

  console.log(`✅ ${availCount} disponibilidades criadas`);

  // ─── MARCAÇÕES DE EXEMPLO ────────────────────────────────────────────────────
  const now = new Date();
  const doctorIds = Object.values(doctors);

  const sampleAppointments = [
    // Futuras (PENDING / CONFIRMED)
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
    // Passadas (COMPLETED / NO_SHOW / CANCELLED)
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
        clinicId: polivi.id,
        doctorId,
        patientName,
        patientEmail: `${patientName.toLowerCase().replace(/\s+/g, ".")}@exemplo.pt`,
        patientPhone: `+351 9${Math.floor(10000000 + Math.random() * 90000000)}`,
        insuranceName: i % 3 === 0 ? "Médis" : i % 3 === 1 ? "ADSE" : undefined,
        scheduledAt,
        durationMin: 30,
        status: appt.status,
        cancelledAt:
          appt.status === AppointmentStatus.CANCELLED ? new Date(scheduledAt) : undefined,
        cancelReason:
          appt.status === AppointmentStatus.CANCELLED ? "Cancelado pelo paciente" : undefined,
        reminderSent: appt.daysOffset < 0,
      },
    });
  }

  console.log(`✅ ${sampleAppointments.length} marcações de exemplo criadas`);

  // ─── UTILIZADORES ────────────────────────────────────────────────────────────
  const hashedAdminPass = await bcrypt.hash("admin123", 12);
  const hashedPoliviPass = await bcrypt.hash("polivi123", 12);

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
    where: { email: "admin@polivi.pt" },
    update: {},
    create: {
      email: "admin@polivi.pt",
      name: "Admin Polivi",
      password: hashedPoliviPass,
      role: UserRole.CLINIC_ADMIN,
      clinicId: polivi.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "recepcao@polivi.pt" },
    update: {},
    create: {
      email: "recepcao@polivi.pt",
      name: "Receção Polivi",
      password: await bcrypt.hash("recepcao123", 12),
      role: UserRole.RECEPTIONIST,
      clinicId: polivi.id,
    },
  });

  console.log("✅ 3 utilizadores criados");
  console.log("\n🎉 Seed concluído com sucesso!\n");
  console.log("  Credenciais de acesso:");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Super Admin  → admin@clinicabot.pt   / admin123");
  console.log("  Admin Polivi → admin@polivi.pt        / polivi123");
  console.log("  Receção      → recepcao@polivi.pt     / recepcao123");
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
