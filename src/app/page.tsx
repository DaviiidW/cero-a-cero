import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";

export default async function HomePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hola, {session.user.nickGlobal}
        </h1>
        <p className="text-muted-foreground">
          Bienvenido a Cero a Cero. Próximamente podrás unirte a grupos y hacer tus predicciones.
        </p>
      </div>
    </div>
  );
}
