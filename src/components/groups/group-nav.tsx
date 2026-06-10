import Link from "next/link";
import { cn } from "@/lib/utils";

type GroupNavProps = {
  groupId: string;
  active: "detail" | "clasificacion" | "partidos" | "predicciones";
};

const items = [
  { key: "detail", href: "", label: "Resumen" },
  { key: "clasificacion", href: "/clasificacion", label: "Clasificación" },
  { key: "partidos", href: "/partidos", label: "Partidos" },
  { key: "predicciones", href: "/predicciones", label: "Historial" },
] as const;

export function GroupNav({ groupId, active }: GroupNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`/grupos/${groupId}${item.href}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            active === item.key
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
