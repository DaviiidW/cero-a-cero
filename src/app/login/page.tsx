import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth-session";

type LoginPageProps = {
  searchParams: Promise<{ reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <>
      {params.reset === "success" ? (
        <div className="bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </div>
      ) : null}
      <LoginForm />
    </>
  );
}
