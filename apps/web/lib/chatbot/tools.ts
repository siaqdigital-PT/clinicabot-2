import type OpenAI from "openai";

/**
 * Definição das ferramentas (function calling) disponíveis para o chatbot Grok.
 * O modelo decide autonomamente quando chamar cada função.
 */
export const chatbotTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Verifica os slots de consulta disponíveis para uma especialidade médica. " +
        "Chama esta função assim que tiveres o nome da especialidade e, opcionalmente, uma data preferida.",
      parameters: {
        type: "object",
        properties: {
          specialtyName: {
            type: "string",
            description:
              "Nome exato da especialidade médica, tal como aparece na lista de especialidades da clínica.",
          },
          preferredDate: {
            type: "string",
            description:
              "Data preferida no formato YYYY-MM-DD (opcional). Se não fornecida, mostra os próximos slots disponíveis.",
          },
        },
        required: ["specialtyName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description:
        "Cria uma marcação de consulta confirmada pelo paciente. " +
        "Chama esta função APENAS após o paciente confirmar explicitamente o slot escolhido.",
      parameters: {
        type: "object",
        properties: {
          patientName: {
            type: "string",
            description: "Nome completo do paciente.",
          },
          patientEmail: {
            type: "string",
            description: "Email do paciente para envio da confirmação.",
          },
          patientPhone: {
            type: "string",
            description: "Número de telefone do paciente.",
          },
          specialtyName: {
            type: "string",
            description: "Nome da especialidade médica.",
          },
          doctorId: {
            type: "string",
            description: "ID do médico, obtido do resultado de check_availability.",
          },
          scheduledAt: {
            type: "string",
            description:
              "Data e hora da consulta em formato ISO 8601 (ex: 2025-01-14T09:00:00Z), " +
              "obtida do resultado de check_availability.",
          },
          insuranceName: {
            type: "string",
            description: "Nome do seguro de saúde do paciente (opcional).",
          },
          notes: {
            type: "string",
            description: "Notas adicionais do paciente sobre a consulta (opcional).",
          },
        },
        required: ["patientName", "patientEmail", "specialtyName", "doctorId", "scheduledAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clinic_info",
      description:
        "Retorna informação geral da clínica: morada, telefone, horários de funcionamento, " +
        "seguros aceites e lista de especialidades. Usa quando o paciente pedir estas informações.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
