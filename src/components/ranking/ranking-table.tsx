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
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className="divide-y divide-border rounded-2xl border border-border">
      {rows.map((row) => (
        <li
          key={row.userId}
          className={`flex items-center justify-between px-4 py-3 ${
            row.userId === highlightUserId ? "bg-muted/50" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 text-muted-foreground">#{row.position}</span>
            <span className="font-medium">{row.nick}</span>
          </div>
          <span className="font-medium">{row.points} pts</span>
        </li>
      ))}
    </ol>
  );
}
