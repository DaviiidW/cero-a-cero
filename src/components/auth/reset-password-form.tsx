"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo restablecer la contraseña");
      return;
    }

    router.push("/login?reset=success");
  }

  if (!token) {
    return (
      <AuthCard
        title="Enlace no válido"
        description="El enlace de recuperación no es válido o ha expirado"
        footer={
          <Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:underline">
            Solicitar un nuevo enlace
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Solicita un nuevo enlace de recuperación para continuar.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Nueva contraseña"
      description="Introduce tu nueva contraseña"
      footer={
        <Link href="/login" className="text-muted-foreground underline-offset-4 hover:underline">
          Volver al inicio de sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-muted-foreground">
          Mínimo 4 caracteres (utiliza una constraseña que no uses en ningún otro sitio).
          </p>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </AuthCard>
  );
}
