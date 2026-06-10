import { requireAuthenticatedUser } from "@/lib/groups/access";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export default async function NuevoGrupoPage() {
  const user = await requireAuthenticatedUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Crear grupo</h1>
        <p className="text-muted-foreground">
          Crea una porra para el Mundial 2026 con tus amigos
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <CreateGroupForm defaultNick={user.nickGlobal} />
      </div>
    </div>
  );
}
