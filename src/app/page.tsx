import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-session";
import { getUserGroups } from "@/lib/groups/service";

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const groups = await getUserGroups(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hola, {session.user.nickGlobal}
        </h1>
        <p className="text-muted-foreground">
          Mundial 2026 — gestiona tus grupos y predicciones
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/grupos">Ver mis grupos ({groups.length})</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/grupos/nuevo">Crear grupo</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/grupos/unirse">Unirse con código</Link>
        </Button>
      </div>
    </div>
  );
}
