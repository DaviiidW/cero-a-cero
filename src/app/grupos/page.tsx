import Link from "next/link";
import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { requireAuthenticatedUser } from "@/lib/groups/access";
import { getUserGroups } from "@/lib/groups/service";

type GruposPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function GruposPage({ searchParams }: GruposPageProps) {
  const user = await requireAuthenticatedUser();
  const groups = await getUserGroups(user.id);
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mis grupos</h1>
          <p className="text-muted-foreground">
            Mundial 2026 — compite con tus amigos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/grupos/unirse">Unirse</Link>
          </Button>
          <Button asChild>
            <Link href="/grupos/nuevo">Crear grupo</Link>
          </Button>
        </div>
      </div>

      {params.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(params.error)}
        </p>
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            Aún no perteneces a ningún grupo.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/grupos/unirse">Unirse con código</Link>
            </Button>
            <Button asChild>
              <Link href="/grupos/nuevo">Crear tu primer grupo</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard key={group.id} {...group} image={group.image} />
          ))}
        </div>
      )}
    </div>
  );
}
