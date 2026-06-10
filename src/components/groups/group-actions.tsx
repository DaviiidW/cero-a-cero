"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type GroupActionsProps = {
  groupId: string;
  isAdmin: boolean;
  members: Array<{
    userId: string;
    nick: string;
    role: string;
  }>;
  currentUserId: string;
};

export function GroupActions({
  groupId,
  isAdmin,
  members,
  currentUserId,
}: GroupActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function handleLeave() {
    if (!confirm("¿Seguro que quieres abandonar este grupo?")) {
      return;
    }

    setLoadingAction("leave");
    setError(null);

    const response = await fetch(`/api/groups/${groupId}/leave`, {
      method: "POST",
    });

    const data = await response.json();
    setLoadingAction(null);

    if (!response.ok) {
      setError(data.error ?? "No se pudo abandonar el grupo");
      return;
    }

    router.push("/grupos");
    router.refresh();
  }

  async function handleKick(userId: string, nick: string) {
    if (!confirm(`¿Expulsar a ${nick} del grupo?`)) {
      return;
    }

    setLoadingAction(userId);
    setError(null);

    const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });

    const data = await response.json();
    setLoadingAction(null);

    if (!response.ok) {
      setError(data.error ?? "No se pudo expulsar al miembro");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        variant="outline"
        onClick={handleLeave}
        disabled={loadingAction !== null}
      >
        {loadingAction === "leave" ? "Saliendo..." : "Abandonar grupo"}
      </Button>

      {isAdmin ? (
        <div className="space-y-2 border-t border-border pt-4">
          <h3 className="text-sm font-medium">Expulsar miembros</h3>
          <ul className="space-y-2">
            {members
              .filter(
                (member) =>
                  member.userId !== currentUserId &&
                  member.role !== "ADMIN"
              )
              .map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span>{member.nick}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleKick(member.userId, member.nick)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === member.userId
                      ? "Expulsando..."
                      : "Expulsar"}
                  </Button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
