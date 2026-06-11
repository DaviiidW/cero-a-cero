"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trophy, ClipboardList, Calendar, Globe, User } from "lucide-react";
import { useGroup } from "@/components/providers/group-provider";
import { useEffect, useState } from "react";

export function MobileNav() {
  const { status } = useSession();
  const { selectedGroupId } = useGroup();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render nothing on the server and until hydration is complete
  // This prevents SSR/client mismatch since session and group state
  // are only available on the client.
  if (!mounted || status !== "authenticated" || !selectedGroupId) return null;

  const fromParam = searchParams.get("from");

  const navItems = [
    {
      label: "Clasificación",
      href: "/",
      icon: Trophy,
      active: fromParam ? false : (pathname === "/" || pathname.startsWith("/grupos/")),
    },
    {
      label: "Predicciones",
      href: "/predicciones",
      icon: ClipboardList,
      active: fromParam === "predicciones" || (fromParam ? false : pathname === "/predicciones"),
    },
    {
      label: "Calendario",
      href: "/calendario",
      icon: Calendar,
      active: fromParam === "calendario" || (fromParam ? false : pathname === "/calendario"),
    },
    {
      label: "Global",
      href: "/ranking",
      icon: Globe,
      active: pathname === "/ranking",
    },
    {
      label: "Perfil",
      href: "/perfil",
      icon: User,
      active: pathname === "/perfil",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/85 backdrop-blur-md md:hidden px-2 py-1 select-none shadow-lg">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-200 active:scale-95 ${
                item.active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-5 mb-0.5 ${item.active ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
