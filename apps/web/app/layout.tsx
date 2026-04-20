import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ClinicaBot — Gestão de Marcações com IA",
    template: "%s | ClinicaBot",
  },
  description:
    "Sistema inteligente de marcação de consultas para clínicas médicas privadas em Portugal.",
  robots: { index: false, follow: false }, // painel é privado
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
