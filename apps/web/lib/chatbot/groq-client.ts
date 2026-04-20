import OpenAI from "openai";
import { z } from "zod";

/** Cliente OpenAI-compatível apontado para a API da Groq */
export const groqClient = new OpenAI({
  apiKey: z.string().min(1, "GROQ_API_KEY é obrigatória").parse(process.env.GROQ_API_KEY),
  baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";
