import { auth } from "@/auth";
import { AccountForm } from "@/components/account/account-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "A minha conta" };

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">A minha conta</h1>
        <p className="text-sm text-gray-500">Gerir as suas informações e segurança</p>
      </div>

      <AccountForm
        name={session?.user?.name ?? ""}
        email={session?.user?.email ?? ""}
        role={session?.user?.role ?? ""}
      />
    </div>
  );
}