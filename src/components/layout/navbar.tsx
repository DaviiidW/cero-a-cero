"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href={isAuthenticated ? "/" : "/login"} className="flex items-center">
          <Image
            src="/logo_0-0nobg.png"
            alt="Cero a Cero"
            width={140}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.nickGlobal}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/grupos">Grupos</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/ranking">Ranking</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/perfil">Perfil</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
