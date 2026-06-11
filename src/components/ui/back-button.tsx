"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition select-none font-bold active:scale-95 duration-200 cursor-pointer"
    >
      <ArrowLeft className="size-3.5" />
      Volver
    </button>
  );
}
