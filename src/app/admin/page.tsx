import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea, edita o sincroniza los partidos del Mundial 2026
          </p>
        </div>
      </div>

      <AdminDashboardClient />
    </div>
  );
}
