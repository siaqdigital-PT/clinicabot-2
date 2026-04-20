import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClinicaBot — Marcações automáticas com IA para clínicas",
  description:
    "A sua clínica a marcar consultas enquanto dorme. Chatbot inteligente, painel de gestão completo, emails automáticos. Comece grátis.",
  openGraph: {
    title: "ClinicaBot — Marcações automáticas com IA",
    description: "Chatbot para clínicas médicas em Portugal. Marque consultas 24/7 com IA.",
    locale: "pt_PT",
    type: "website",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
