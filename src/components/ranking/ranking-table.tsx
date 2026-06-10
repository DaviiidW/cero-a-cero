import Link from "next/link";

type RankingRow = {
  userId: string;
  nick: string;
  points: number;
  position: number;
};

type RankingTableProps = {
  rows: RankingRow[];
  highlightUserId?: string;
  emptyMessage?: string;
};

export function RankingTable({
  rows,
  highlightUserId,
  emptyMessage = "No hay datos de clasificación todavía.",
}: RankingTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground select-none">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
      {rows.map((row) => {
        const isSelf = row.userId === highlightUserId;
        
        return (
          <li
            key={row.userId}
            className={`flex items-center justify-between px-4 py-3.5 transition hover:bg-muted/10 ${
              isSelf ? "bg-primary/5 border-l-4 border-l-primary" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 text-xs font-bold text-muted-foreground select-none">#{row.position}</span>
              {isSelf ? (
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  {row.nick}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">Tú</span>
                </span>
              ) : (
                <Link
                  href={`/perfil/${row.userId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline transition"
                >
                  {row.nick}
                </Link>
              )}
            </div>
            <span className="font-bold text-sm text-foreground">{row.points} pts</span>
          </li>
        );
      })}
    </ol>
  );
}
