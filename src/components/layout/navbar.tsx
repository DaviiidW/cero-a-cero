"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useGroup } from "@/components/providers/group-provider";

import { useState, useEffect } from "react";
import { Sun, Moon, LogOut, Settings, Users } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const pathname = usePathname();
  const router = useRouter();

  const { groups, selectedGroupId, changeGroup } = useGroup();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  async function handleSignOut() {
    await signOut({ callbackUrl: "/" });
  }

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 gap-4">
        
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/grupos" : "/"}
          className="flex items-center shrink-0"
          onClick={() => isAuthenticated && changeGroup(null)}
        >
          <Image
            src="/logo_0-0nobg.png"
            alt="Cero a Cero"
            width={120}
            height={36}
            priority
            className="h-9 w-auto"
          />
        </Link>


        {/* Menu button replacing the old dropdown */}
        {isAuthenticated && selectedGroupId && (
          <div className="flex items-center shrink-0 min-w-0">
            <Button
              onClick={() => {
                changeGroup(null);
                router.push("/grupos");
              }}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold border-border bg-background hover:bg-muted text-foreground transition active:scale-95 shrink-0 flex items-center gap-1.5 px-3 rounded-lg shadow-sm"
            >
              <Users className="size-3.5" />
              <span>Menú</span>
            </Button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Desktop links */}
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant={pathname === "/" ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href="/" className="text-xs font-semibold">Clasificación</Link>
                </Button>
                <Button
                  variant={pathname === "/predicciones" ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href="/predicciones" className="text-xs font-semibold">Predicciones</Link>
                </Button>
                <Button
                  variant={pathname === "/calendario" ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href="/calendario" className="text-xs font-semibold">Calendario</Link>
                </Button>
                <Button
                  variant={pathname === "/ranking" ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href="/ranking" className="text-xs font-semibold">Global</Link>
                </Button>
              </div>

              {/* Super Admin Dashboard link */}
              {isSuperAdmin && (
                <Button
                  variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className="text-amber-500 hover:text-amber-600"
                >
                  <Link href="/admin" className="text-xs font-semibold flex items-center gap-1">
                    <Settings className="size-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}

              {/* User profile (Desktop only) */}
              <div className="hidden md:flex items-center gap-1.5">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/perfil" className="text-xs font-semibold">
                    {session.user.nickGlobal}
                  </Link>
                </Button>
                <button
                  onClick={handleSignOut}
                  aria-label="Cerrar sesión"
                  className="flex items-center justify-center size-8 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition active:scale-95 shrink-0"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login" className="text-xs font-semibold">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/register" className="text-xs font-semibold">Registrarse</Link>
              </Button>
            </>
          )}

          {/* Theme Toggle — always visible regardless of auth state */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="flex items-center justify-center size-8 rounded-lg border border-input hover:bg-muted text-foreground transition active:scale-95 shrink-0"
          >
            {theme === "light" ? (
              <Moon className="size-4 fill-foreground/10" />
            ) : (
              <Sun className="size-4 text-accent" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
