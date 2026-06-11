"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useGroup } from "@/components/providers/group-provider";

/**
 * Maps child routes to their logical parent.
 * Order matters: more specific patterns first.
 */
const PARENT_ROUTES: { pattern: RegExp; parent: (match: RegExpMatchArray) => string }[] = [
  // /grupos/[id]/clasificacion  → /grupos/[id]
  {
    pattern: /^\/grupos\/([^/]+)\/(clasificacion|predicciones|partidos)$/,
    parent: (m) => `/grupos/${m[1]}`,
  },
  // /grupos/[id]  → / (dashboard del grupo)
  {
    pattern: /^\/grupos\/([^/]+)$/,
    parent: () => `/`,
  },
  // /grupos/nuevo  → /grupos (menú)
  {
    pattern: /^\/grupos\/nuevo$/,
    parent: () => `/grupos`,
  },
  // /grupos/unirse  → /grupos (menú)
  {
    pattern: /^\/grupos\/unirse$/,
    parent: () => `/grupos`,
  },
  // /  (dashboard con grupo seleccionado) → /grupos (menú)
  {
    pattern: /^\/$/,
    parent: () => `/grupos`,
  },
  // /perfil/[userId]  → /perfil
  {
    pattern: /^\/perfil\/[^/]+$/,
    parent: () => `/perfil`,
  },
  // /forgot-password  → /login
  {
    pattern: /^\/forgot-password$/,
    parent: () => `/login`,
  },
  // /reset-password  → /login
  {
    pattern: /^\/reset-password$/,
    parent: () => `/login`,
  },
];

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedGroupId } = useGroup();

  // Find if the current path has a defined parent
  let parentHref: string | null = null;
  for (const { pattern, parent } of PARENT_ROUTES) {
    const match = pathname.match(pattern);
    if (match) {
      parentHref = parent(match);
      break;
    }
  }

  if (!parentHref) return null;

  // On the root dashboard, only show back button if a group is actually selected
  // (otherwise the user is being redirected to /grupos and the button is confusing)
  if (pathname === "/" && !selectedGroupId) return null;

  const href = parentHref;

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label="Volver atrás"
      className="flex items-center justify-center size-8 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition active:scale-95 shrink-0"
    >
      <ChevronLeft className="size-4" />
    </button>
  );
}
