"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getWhatsAppShareLink } from "@/lib/groups/share";

type InviteInfoProps = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  inviteLink: string;
  inviteActive: boolean;
  inviteExpiresAt: string;
};

export function InviteInfo({
  groupId,
  groupName,
  inviteCode: initialInviteCode,
  inviteLink: initialInviteLink,
  inviteActive: initialInviteActive,
  inviteExpiresAt: initialInviteExpiresAt,
}: InviteInfoProps) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [inviteLink, setInviteLink] = useState(initialInviteLink);
  const [inviteActive, setInviteActive] = useState(initialInviteActive);
  const [inviteExpiresAt, setInviteExpiresAt] = useState(initialInviteExpiresAt);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const displayInviteLink = origin && !origin.includes("localhost")
    ? `${origin}/unirse/${inviteCode}` 
    : `https://cero-a-cero-hu3u.vercel.app/unirse/${inviteCode}`;

  const whatsAppLink = getWhatsAppShareLink(groupName, inviteCode, displayInviteLink);

  async function copy(value: string, type: "code" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRefreshInvite() {
    if (
      !confirm(
        "¿Generar un nuevo código? El código y enlace actuales dejarán de funcionar."
      )
    ) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    const response = await fetch(`/api/groups/${groupId}/invite/refresh`, {
      method: "POST",
    });

    const data = await response.json();
    setIsRefreshing(false);

    if (!response.ok) {
      setError(data.error ?? "No se pudo actualizar el código");
      return;
    }

    setInviteCode(data.inviteCode);
    setInviteLink(data.inviteLink);
    setInviteExpiresAt(data.inviteExpiresAt);
    setInviteActive(data.inviteActive);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Invitación al grupo</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshInvite}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Actualizando..." : "Nuevo código"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-background px-2 py-1 text-sm">
          {inviteCode}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(inviteCode, "code")}
        >
          {copied === "code" ? "Copiado" : "Copiar código"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {displayInviteLink}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(displayInviteLink, "link")}
        >
          {copied === "link" ? "Copiado" : "Copiar enlace"}
        </Button>
      </div>

      <Button
        className="w-full bg-[#25D366] text-white hover:bg-[#20BD5A]"
        size="sm"
        asChild
      >
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Compartir por WhatsApp
        </a>
      </Button>

      <p className="text-xs text-muted-foreground">
        {inviteActive
          ? `Código activo hasta ${new Date(inviteExpiresAt).toLocaleString("es-ES")}`
          : "El código de invitación ha caducado. Pulsa «Nuevo código» para generar uno."}
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
