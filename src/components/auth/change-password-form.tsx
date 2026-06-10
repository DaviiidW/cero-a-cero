"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Introduce tu contraseña actual" }),
  newPassword: z.string().min(4, { message: "La nueva contraseña debe tener al menos 4 caracteres" }),
});

type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordSchemaType) {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo actualizar la contraseña");
      return;
    }

    setSuccess(data.message ?? "Contraseña actualizada correctamente");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          disabled={isLoading}
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          disabled={isLoading}
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {errors.newPassword.message}
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

      {success ? (
        <p className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
        {isLoading ? "Actualizando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}

