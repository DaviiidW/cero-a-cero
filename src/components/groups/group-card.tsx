import Image from "next/image";
import Link from "next/link";
import { DEFAULT_GROUP_IMAGE } from "@/lib/constants/groups";

type GroupCardProps = {
  id: string;
  name: string;
  image: string | null;
  nick: string;
  memberCount: number;
  position: number | null;
};

export function GroupCard({
  id,
  name,
  image,
  nick,
  memberCount,
  position,
}: GroupCardProps) {
  return (
    <Link
      href={`/grupos/${id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <Image
        src={image || DEFAULT_GROUP_IMAGE}
        alt={name}
        width={56}
        height={56}
        className="size-14 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-medium">{name}</h2>
        <p className="text-sm text-muted-foreground">
          Tu nick: {nick} · {memberCount} miembros
        </p>
      </div>
      {position ? (
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Posición</p>
          <p className="text-lg font-semibold">#{position}</p>
        </div>
      ) : null}
    </Link>
  );
}
