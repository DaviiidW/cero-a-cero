"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";

const registerSchema = z.object({
  email: z.string().email({ message: "Introduce un correo electrónico válido" }),
  nick: z.string().min(2, { message: "El nick debe tener al menos 2 caracteres" }),
  password: z.string().min(4, { message: "La contraseña debe tener al menos 4 caracteres" }),
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      nick: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterSchemaType) {
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      setIsLoading(false);
      setError(data.error ?? "No se pudo completar el registro");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setIsLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard
      title="Crear cuenta"
      description="Regístrate para participar en la porra"
      footer={
        <p className="text-muted-foreground text-xs">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline text-primary">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[11px] font-medium text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nick">Nick</Label>
          <Input
            id="nick"
            autoComplete="username"
            disabled={isLoading}
            {...register("nick")}
          />
          {errors.nick && (
            <p className="text-[11px] font-medium text-destructive" role="alert">
              {errors.nick.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-[11px] font-medium text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Mínimo 4 caracteres (utiliza una contraseña que no uses en ningún otro sitio).
          </p>
        </div>

        {error ? (
          <p className="text-xs font-semibold text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Registrarse"}
        </Button>
      </form>
    </AuthCard>
  );
}

