"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JoinGroupFormProps = {
  defaultCode?: string;
  defaultNick: string;
  groupName?: string;
};

export function JoinGroupForm({
  defaultCode = "",
  defaultNick,
  groupName,
}: JoinGroupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      code: String(formData.get("code") ?? ""),
      nick: String(formData.get("nick") ?? ""),
    };

    const response = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo unir al grupo");
      return;
    }

    router.push(`/grupos/${data.groupId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {groupName ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          Te unes a: <strong>{groupName}</strong>
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="code">Código de invitación</Label>
        <Input
          id="code"
          name="code"
          defaultValue={defaultCode}
          required
          className="uppercase"
          placeholder="AB12CD34"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nick">Tu nick en el grupo</Label>
        <Input id="nick" name="nick" defaultValue={defaultNick} required />
        <p className="text-xs text-muted-foreground">
          Debe ser único dentro del grupo.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Uniéndote..." : "Unirse al grupo"}
      </Button>
    </form>
  );
}
