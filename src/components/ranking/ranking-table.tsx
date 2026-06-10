import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border select-none">
            <TableHead className="w-16 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Pos</TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Miembro</TableHead>
            <TableHead className="w-24 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isSelf = row.userId === highlightUserId;

            return (
              <TableRow
                key={row.userId}
                className={`transition hover:bg-muted/10 border-b border-border/60 ${
                  isSelf ? "bg-primary/5 hover:bg-primary/10" : ""
                }`}
              >
                <TableCell className="text-center font-black text-xs text-muted-foreground select-none">
                  #{row.position}
                </TableCell>
                <TableCell className="py-3.5">
                  {isSelf ? (
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      {row.nick}
                      <Badge variant="emerald" className="text-[8px] font-extrabold uppercase py-0 px-1 rounded select-none">
                        Tú
                      </Badge>
                    </span>
                  ) : (
                    <Link
                      href={`/perfil/${row.userId}`}
                      className="font-medium text-foreground hover:text-primary hover:underline transition"
                    >
                      {row.nick}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-right font-bold text-foreground">
                  {row.points} pts
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
