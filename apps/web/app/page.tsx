import { redirect } from "next/navigation";

/** Raiz da aplicação — redireciona para o dashboard ou login */
export default function RootPage() {
  redirect("/dashboard");
}
