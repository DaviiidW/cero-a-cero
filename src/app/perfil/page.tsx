import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getSession } from "@/lib/auth-session";

export default async function PerfilPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">
            {session.user.nickGlobal} · {session.user.email}
          </p>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-lg font-medium">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
