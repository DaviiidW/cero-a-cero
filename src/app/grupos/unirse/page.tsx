import { requireAuthenticatedUser } from "@/lib/groups/access";
import { JoinGroupForm } from "@/components/groups/join-group-form";

export default async function UnirseGrupoPage() {
  const user = await requireAuthenticatedUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Unirse a un grupo</h1>
        <p className="text-muted-foreground">
          Introduce el código de invitación que te ha compartido el administrador
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <JoinGroupForm defaultNick={user.nickGlobal} />
      </div>
    </div>
  );
}
