import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Trophy, Star } from "lucide-react";

type RankingRow = {
  userId: string;
  nick: string;
  points: number;
  position: number;
  matchPoints?: number;
  bonusPoints?: number;
  exactCount?: number;
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

  const hasDetails = rows.length > 0 && typeof rows[0].matchPoints === "number";

  return (
    <div className="space-y-4">
      {/* VISTA ESCRITORIO: TABLA COMPLETA */}
      <div className="hidden sm:block rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border select-none">
              <TableHead className="w-16 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Pos</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Miembro</TableHead>
              {hasDetails && (
                <>
                  <TableHead className="w-24 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Partidos</TableHead>
                  <TableHead className="w-24 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Especiales</TableHead>
                  <TableHead className="w-16 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground" title="Marcadores Exactos (4 pts)">M.E.</TableHead>
                </>
              )}
              <TableHead className="w-24 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">{hasDetails ? "Total" : "Puntos"}</TableHead>
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
                  {hasDetails && (
                    <>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {row.matchPoints} pts
                      </TableCell>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {row.bonusPoints} pts
                      </TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        {row.exactCount}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-bold text-foreground">
                    {row.points} pts
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* VISTA MÓVIL: CARDS ELEGANTES ADAPTADAS */}
      <div className="block sm:hidden space-y-3">
        {rows.map((row) => {
          const isSelf = row.userId === highlightUserId;

          let positionBadge = null;
          if (row.position === 1) {
            positionBadge = <span className="flex items-center justify-center size-7 rounded-full bg-yellow-500 text-yellow-950 font-black text-xs shadow-sm">1</span>;
          } else if (row.position === 2) {
            positionBadge = <span className="flex items-center justify-center size-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">2</span>;
          } else if (row.position === 3) {
            positionBadge = <span className="flex items-center justify-center size-7 rounded-full bg-amber-600 text-amber-50 font-black text-xs shadow-sm">3</span>;
          } else {
            positionBadge = <span className="flex items-center justify-center size-7 rounded-full bg-muted text-muted-foreground font-bold text-xs">#{row.position}</span>;
          }

          return (
            <div
              key={row.userId}
              className={`p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3 relative ${
                isSelf ? "ring-2 ring-primary/20 bg-primary/5 border-primary/20" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {positionBadge}
                  {isSelf ? (
                    <span className="font-bold text-foreground flex items-center gap-1.5 min-w-0 truncate">
                      <span className="truncate">{row.nick}</span>
                      <Badge variant="emerald" className="text-[8px] font-extrabold uppercase py-0 px-1 rounded shrink-0 select-none">
                        Tú
                      </Badge>
                    </span>
                  ) : (
                    <Link
                      href={`/perfil/${row.userId}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline transition truncate"
                    >
                      {row.nick}
                    </Link>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-foreground">{row.points} pts</span>
                  <span className="block text-[8px] text-muted-foreground uppercase font-bold tracking-wider select-none">Total</span>
                </div>
              </div>

              {hasDetails && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/55 text-center select-none">
                  <div className="space-y-0.5">
                    <span className="block text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Partidos</span>
                    <span className="text-xs font-semibold text-foreground">{row.matchPoints} pts</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Especiales</span>
                    <span className="text-xs font-semibold text-foreground">{row.bonusPoints} pts</span>
                  </div>
                  <div className="space-y-0.5" title="Marcadores Exactos">
                    <span className="block text-[8px] text-muted-foreground uppercase font-bold tracking-wider">M.E.</span>
                    <span className="text-xs font-black text-primary">{row.exactCount}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PANEL INFORMATIVO DE PUNTUACIONES */}
      {hasDetails && (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider select-none">
              <Info className="size-4 shrink-0 text-primary" />
              Guía de Puntuación y Desempates
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-foreground border-b border-border/40 pb-1 flex items-center gap-1 select-none">
                  <Star className="size-3.5 text-accent fill-accent/10" />
                  Distribución de Puntos
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-muted-foreground">
                  <li><strong>Partidos (Resultados regulares)</strong>:
                    <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                      <li><span className="text-foreground font-semibold">4 puntos</span> por acertar el marcador exacto.</li>
                      <li><span className="text-foreground font-semibold">1 punto</span> por acertar ganador o empate (1X2) pero no el marcador.</li>
                    </ul>
                  </li>
                  <li><strong>Especiales (Bonos de torneo)</strong>:
                    <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                      <li>Campeón: <span className="text-foreground font-semibold">10 puntos</span>.</li>
                      <li>Subcampeón: <span className="text-foreground font-semibold">8 puntos</span>.</li>
                      <li>Tercer puesto: <span className="text-foreground font-semibold">6 puntos</span>.</li>
                      <li>Peor Selección: <span className="text-foreground font-semibold">+1 punto</span> por cada 3 goles encajados y <span className="text-foreground font-semibold">-1 punto</span> por cada gol marcado.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-foreground border-b border-border/40 pb-1 flex items-center gap-1 select-none">
                  <Trophy className="size-3.5 text-yellow-500" />
                  Criterios de Desempate (en orden)
                </p>
                <ol className="space-y-1.5 list-decimal pl-4 text-muted-foreground">
                  <li><strong>M.E. (Marcadores Exactos)</strong>: Quien tenga la mayor cantidad de aciertos perfectos de marcador exacto (4 puntos).</li>
                  <li><strong>Campeón del Mundo</strong>: Quien haya acertado correctamente el campeón del mundo en su predicción especial.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
