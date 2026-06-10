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
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email({ message: "Introduce un correo electrónico válido" }),
  password: z.string().min(1, { message: "La contraseña es obligatoria" }),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginSchemaType) {
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError(INVALID_CREDENTIALS_MESSAGE);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Accede a tu cuenta para participar en la porra"
      footer={
        <p className="text-muted-foreground text-xs">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-foreground underline-offset-4 hover:underline text-primary">
            Regístrate
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-[11px] font-medium text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {error ? (
          <p className="text-xs font-semibold text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}

