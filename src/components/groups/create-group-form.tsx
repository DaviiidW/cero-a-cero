"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateGroupFormProps = {
  defaultNick: string;
};

export function CreateGroupForm({ defaultNick }: CreateGroupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      image: String(formData.get("image") ?? ""),
      nick: String(formData.get("nick") ?? ""),
    };

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo crear el grupo");
      return;
    }

    router.push(`/grupos/${data.group.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del grupo</Label>
        <Input id="name" name="name" required placeholder="Los cracks del 2026" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Imagen (URL, opcional)</Label>
        <Input
          id="image"
          name="image"
          type="url"
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Si no indicas ninguna, se usará la imagen por defecto.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nick">Tu nick en el grupo</Label>
        <Input id="nick" name="nick" defaultValue={defaultNick} required />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creando..." : "Crear grupo"}
      </Button>
    </form>
  );
}
