"use client";

import { useState, useEffect } from "react";
import { formatScore } from "@/lib/scoring/labels";
import { formatUTCtoMadridTime } from "@/lib/date-timezone";

type Match = {
  id: string;
  externalId: number | null;
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest: string | null;
  awayTeamCrest: string | null;
  date: string;
  phase: string;
  groupStageNumber: number | null;
  jornada: number;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  qualifyingTeam: string | null;
};

const PHASES = [
  "Fase de grupos",
  "Dieciseisavos de final",
  "Octavos de final",
  "Cuartos de final",
  "Semifinales",
  "Tercer puesto",
  "Final",
];

const JORNADAS = [
  { id: 1, label: "Jornada 1" },
  { id: 2, label: "Jornada 2" },
  { id: 3, label: "Jornada 3" },
  { id: 4, label: "Dieciseisavos de final (J4)" },
  { id: 5, label: "Octavos de final (J5)" },
  { id: 6, label: "Cuartos de final (J6)" },
  { id: 7, label: "Semifinales (J7)" },
  { id: 8, label: "Tercer puesto y Final (J8)" },
];

export function AdminDashboardClient() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filterJornada, setFilterJornada] = useState<number | "all">("all");

  // Create match modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    homeTeam: "",
    awayTeam: "",
    homeTeamCrest: "",
    awayTeamCrest: "",
    date: "",
    phase: "Fase de grupos",
    groupStageNumber: "",
    jornada: "1",
    status: "SCHEDULED",
    homeGoals: "",
    awayGoals: "",
    qualifyingTeam: "",
  });

  // Edit match modal state
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState({
    homeTeam: "",
    awayTeam: "",
    homeTeamCrest: "",
    awayTeamCrest: "",
    date: "",
    phase: "",
    groupStageNumber: "",
    jornada: "1",
    status: "",
    homeGoals: "",
    awayGoals: "",
    qualifyingTeam: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [savingResults, setSavingResults] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [recalculatingGroup, setRecalculatingGroup] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/matches");
      if (!response.ok) {
        throw new Error("No se pudieron cargar los partidos.");
      }
      const data = await response.json();
      setMatches(data.matches);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar partidos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentResults = async () => {
    try {
      const response = await fetch("/api/admin/tournament-results");
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setChampion(data.result.champion || "");
          setRunnerUp(data.result.runnerUp || "");
          setThirdPlace(data.result.thirdPlace || "");
        }
      }
    } catch (err) {
      console.error("Error fetching tournament results:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/admin/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
        if (data.groups && data.groups.length > 0) {
          setSelectedGroupId(data.groups[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  // Automatically update qualifyingTeam based on scores for create form
  useEffect(() => {
    const jNum = parseInt(createForm.jornada, 10);
    const hg = createForm.homeGoals !== "" ? parseInt(createForm.homeGoals, 10) : null;
    const ag = createForm.awayGoals !== "" ? parseInt(createForm.awayGoals, 10) : null;
    if (jNum >= 4 && hg !== null && ag !== null) {
      if (hg > ag) {
        setCreateForm((prev) => ({ ...prev, qualifyingTeam: createForm.homeTeam }));
      } else if (hg < ag) {
        setCreateForm((prev) => ({ ...prev, qualifyingTeam: createForm.awayTeam }));
      }
    }
  }, [createForm.homeGoals, createForm.awayGoals, createForm.homeTeam, createForm.awayTeam, createForm.jornada]);

  // Automatically update qualifyingTeam based on scores for edit form
  useEffect(() => {
    const jNum = parseInt(editForm.jornada, 10);
    const hg = editForm.homeGoals !== "" ? parseInt(editForm.homeGoals, 10) : null;
    const ag = editForm.awayGoals !== "" ? parseInt(editForm.awayGoals, 10) : null;
    if (jNum >= 4 && hg !== null && ag !== null) {
      if (hg > ag) {
        setEditForm((prev) => ({ ...prev, qualifyingTeam: editForm.homeTeam }));
      } else if (hg < ag) {
        setEditForm((prev) => ({ ...prev, qualifyingTeam: editForm.awayTeam }));
      }
    }
  }, [editForm.homeGoals, editForm.awayGoals, editForm.homeTeam, editForm.awayTeam, editForm.jornada]);

  useEffect(() => {
    fetchMatches();
    fetchTournamentResults();
    fetchGroups();
  }, []);

  const handleRecalculateGroupRanking = async () => {
    if (!selectedGroupId) return;
    const groupName = groups.find((g) => g.id === selectedGroupId)?.name || "este grupo";
    if (!confirm(`¿Estás seguro de que deseas recalcular la clasificación del grupo "${groupName}"?`)) {
      return;
    }
    setRecalculatingGroup(true);
    try {
      const response = await fetch("/api/admin/recalculate-group-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al recalcular.");
      }
      alert(data.message || "Clasificación recalculada con éxito.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al recalcular.");
    } finally {
      setRecalculatingGroup(false);
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResults(true);
    try {
      const response = await fetch("/api/admin/tournament-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion, runnerUp, thirdPlace }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar resultados.");
      }
      alert("Resultados oficiales del torneo guardados con éxito.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSavingResults(false);
    }
  };

  const handleRecalculatePoints = async () => {
    if (!confirm("¿Estás seguro de que deseas recalcular todos los puntos de las predicciones? Esto restablecerá y volverá a calcular las puntuaciones de todos los usuarios en base a las nuevas reglas 4-1-0.")) {
      return;
    }
    setRecalculating(true);
    try {
      const response = await fetch("/api/admin/recalculate-points", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al recalcular.");
      }
      alert(`Puntos recalculados exitosamente:\n- Partidos procesados: ${data.matchesProcessed}\n- Predicciones recalculadas: ${data.predictionsProcessed}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al recalcular.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/matches/sync", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al sincronizar.");
      }
      alert(`Sincronización exitosa:\n- Partidos actualizados: ${data.matchesSynced}\n- Predicciones procesadas: ${data.predictionsProcessed}`);
      fetchMatches();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de sincronización.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al crear el partido.");
      }

      setFormSuccess("¡Partido creado con éxito!");
      setShowCreate(false);
      // Reset form
      setCreateForm({
        homeTeam: "",
        awayTeam: "",
        homeTeamCrest: "",
        awayTeamCrest: "",
        date: "",
        phase: "Fase de grupos",
        groupStageNumber: "",
        jornada: "1",
        status: "SCHEDULED",
        homeGoals: "",
        awayGoals: "",
        qualifyingTeam: "",
      });
      fetchMatches();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al crear el partido.");
    }
  };

  const handleEditClick = (match: Match) => {
    // Formatter for datetime-local input (YYYY-MM-DDTHH:mm)
    const formattedDate = formatUTCtoMadridTime(match.date);

    setEditingMatch(match);
    setEditForm({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeTeamCrest: match.homeTeamCrest || "",
      awayTeamCrest: match.awayTeamCrest || "",
      date: formattedDate,
      phase: match.phase,
      groupStageNumber: match.groupStageNumber !== null ? match.groupStageNumber.toString() : "",
      jornada: match.jornada.toString(),
      status: match.status,
      homeGoals: match.homeGoals !== null ? match.homeGoals.toString() : "",
      awayGoals: match.awayGoals !== null ? match.awayGoals.toString() : "",
      qualifyingTeam: match.qualifyingTeam || "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await fetch(`/api/admin/matches/${editingMatch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el partido.");
      }

      setFormSuccess("¡Partido actualizado correctamente!");
      setEditingMatch(null);
      fetchMatches();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al actualizar el partido.");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este partido?")) return;

    try {
      const response = await fetch(`/api/admin/matches/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar.");
      }

      fetchMatches();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  const filteredMatches = filterJornada === "all"
    ? matches
    : matches.filter((m) => m.jornada === filterJornada);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FINISHED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500">Finalizado</span>;
      case "LIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 animate-pulse">En juego</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-500">Programado</span>;
    }
  };

  const teamsSet = new Set<string>();
  for (const m of matches) {
    if (m.homeTeam && m.homeTeam !== "Por definir") teamsSet.add(m.homeTeam);
    if (m.awayTeam && m.awayTeam !== "Por definir") teamsSet.add(m.awayTeam);
  }
  const teams = Array.from(teamsSet).sort();

  return (
    <div className="space-y-6">
      {/* PANEL DE CONTROL DE TORNEO (RESULTADOS REALES Y RECALCULAR PUNTOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        
        {/* Resultados oficiales */}
        <form onSubmit={handleSaveResults} className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 select-none">
              🏆 Resultados Oficiales del Mundial
            </h3>
            <p className="text-xs text-muted-foreground select-none">
              Establece los resultados reales para calcular las predicciones especiales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground select-none">Campeón</label>
              <select
                value={champion}
                onChange={(e) => setChampion(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">TBD</option>
                {teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground select-none">Subcampeón</label>
              <select
                value={runnerUp}
                onChange={(e) => setRunnerUp(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">TBD</option>
                {teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground select-none">Tercer Puesto</label>
              <select
                value={thirdPlace}
                onChange={(e) => setThirdPlace(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">TBD</option>
                {teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingResults}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer animate-fade-in"
          >
            {savingResults ? "Guardando..." : "Guardar Resultados Oficiales"}
          </button>
        </form>

        {/* Acciones de recalculación */}
        <div className="space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 select-none">
                🔄 Mantenimiento y Puntuaciones
              </h3>
              <p className="text-xs text-muted-foreground select-none">
                Recalcula todos los puntos de las predicciones de partidos guardados en base al nuevo sistema 4-1-0.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleRecalculatePoints}
                disabled={recalculating}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-extrabold rounded-lg bg-destructive text-white hover:bg-destructive/90 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {recalculating ? "Recalculando..." : "Recalcular Todos los Puntos (4-1-0)"}
              </button>
            </div>

            {/* Recalcular grupo específico */}
            {groups.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground select-none">
                    🎯 Recalcular Grupo Individual
                  </h4>
                  <p className="text-[11px] text-muted-foreground select-none">
                    Recalcula y actualiza la clasificación de un único grupo específico.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleRecalculateGroupRanking}
                    disabled={recalculatingGroup || !selectedGroupId}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {recalculatingGroup ? "Recalculando..." : "Recalcular Grupo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Botones de acción y filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground select-none">Jornada:</label>
          <select
            value={filterJornada}
            onChange={(e) => setFilterJornada(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todas las jornadas</option>
            {JORNADAS.map((j) => (
              <option key={j.id} value={j.id}>{j.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition disabled:opacity-50"
          >
            {syncing ? "Sincronizando..." : "Sincronizar desde API"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            Añadir Partido
          </button>
        </div>
      </div>

      {/* Listado de partidos */}
      {loading ? (
        <p className="text-center py-10 text-muted-foreground">Cargando partidos...</p>
      ) : error ? (
        <p className="text-center py-10 text-destructive font-medium">{error}</p>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-border text-muted-foreground">
          No hay partidos en esta jornada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium select-none">
                <tr>
                  <th className="px-4 py-3">Jornada / Fase</th>
                  <th className="px-4 py-3">Partido</th>
                  <th className="px-4 py-3 text-center">Marcador</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Fecha y Hora (Local)</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      J{match.jornada} · {match.phase}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {match.homeTeamCrest && (
                          <img src={match.homeTeamCrest} alt="flag" className="h-3.5 w-5 object-cover rounded-sm border border-muted/50" />
                        )}
                        <span>{match.homeTeam}</span>
                        <span className="text-xs text-muted-foreground font-normal mx-0.5">vs</span>
                        {match.awayTeamCrest && (
                          <img src={match.awayTeamCrest} alt="flag" className="h-3.5 w-5 object-cover rounded-sm border border-muted/50" />
                        )}
                        <span>{match.awayTeam}</span>
                      </div>
                      {match.jornada >= 4 && match.qualifyingTeam && (
                        <div className="text-[10px] text-accent font-bold mt-0.5">
                          Clasificado: {match.qualifyingTeam}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-base whitespace-nowrap">
                      {formatScore(match.homeGoals, match.awayGoals)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {getStatusBadge(match.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {new Date(match.date).toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(match)}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-input hover:bg-muted/80 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(match.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR PARTIDO */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Añadir Nuevo Partido</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium">Equipo Local</label>
                  <input
                    type="text"
                    required
                    value={createForm.homeTeam}
                    onChange={(e) => setCreateForm({ ...createForm, homeTeam: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Equipo Visitante</label>
                  <input
                    type="text"
                    required
                    value={createForm.awayTeam}
                    onChange={(e) => setCreateForm({ ...createForm, awayTeam: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium">Bandera Local (URL crest)</label>
                  <input
                    type="text"
                    value={createForm.homeTeamCrest}
                    onChange={(e) => setCreateForm({ ...createForm, homeTeamCrest: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-xs"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Bandera Visitante (URL crest)</label>
                  <input
                    type="text"
                    value={createForm.awayTeamCrest}
                    onChange={(e) => setCreateForm({ ...createForm, awayTeamCrest: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-xs"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.date}
                  onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-medium">Fase</label>
                  <select
                    value={createForm.phase}
                    onChange={(e) => setCreateForm({ ...createForm, phase: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    {PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Jornada (1-8)</label>
                  <select
                    value={createForm.jornada}
                    onChange={(e) => setCreateForm({ ...createForm, jornada: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    {JORNADAS.map((j) => (
                      <option key={j.id} value={j.id}>{j.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Grupo (Nº)</label>
                  <input
                    type="number"
                    value={createForm.groupStageNumber}
                    onChange={(e) => setCreateForm({ ...createForm, groupStageNumber: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-medium">Estado</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="SCHEDULED">Programado</option>
                    <option value="LIVE">En juego</option>
                    <option value="FINISHED">Finalizado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Goles Local</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.homeGoals}
                    onChange={(e) => setCreateForm({ ...createForm, homeGoals: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="-"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Goles Visitante</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.awayGoals}
                    onChange={(e) => setCreateForm({ ...createForm, awayGoals: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="-"
                  />
                </div>
              </div>

              {parseInt(createForm.jornada, 10) >= 4 && (
                <div className="space-y-1">
                  <label className="font-medium">Equipo Clasificado</label>
                  <select
                    value={createForm.qualifyingTeam}
                    onChange={(e) => setCreateForm({ ...createForm, qualifyingTeam: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Por definir (TBD)</option>
                    {createForm.homeTeam && <option value={createForm.homeTeam}>{createForm.homeTeam} (Local)</option>}
                    {createForm.awayTeam && <option value={createForm.awayTeam}>{createForm.awayTeam} (Visitante)</option>}
                  </select>
                </div>
              )}

              {formError && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{formError}</p>}
              {formSuccess && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded">{formSuccess}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-input rounded-lg hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
                >
                  Crear Partido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PARTIDO */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Editar Partido</h3>
              <button onClick={() => setEditingMatch(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium">Equipo Local</label>
                  <input
                    type="text"
                    required
                    value={editForm.homeTeam}
                    onChange={(e) => setEditForm({ ...editForm, homeTeam: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Equipo Visitante</label>
                  <input
                    type="text"
                    required
                    value={editForm.awayTeam}
                    onChange={(e) => setEditForm({ ...editForm, awayTeam: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium">Bandera Local (URL crest)</label>
                  <input
                    type="text"
                    value={editForm.homeTeamCrest}
                    onChange={(e) => setEditForm({ ...editForm, homeTeamCrest: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Bandera Visitante (URL crest)</label>
                  <input
                    type="text"
                    value={editForm.awayTeamCrest}
                    onChange={(e) => setEditForm({ ...editForm, awayTeamCrest: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-medium">Fase</label>
                  <select
                    value={editForm.phase}
                    onChange={(e) => setEditForm({ ...editForm, phase: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    {PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Jornada (1-8)</label>
                  <select
                    value={editForm.jornada}
                    onChange={(e) => setEditForm({ ...editForm, jornada: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    {JORNADAS.map((j) => (
                      <option key={j.id} value={j.id}>{j.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Grupo (Nº)</label>
                  <input
                    type="number"
                    value={editForm.groupStageNumber}
                    onChange={(e) => setEditForm({ ...editForm, groupStageNumber: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-medium">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="SCHEDULED">Programado</option>
                    <option value="LIVE">En juego</option>
                    <option value="FINISHED">Finalizado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Goles Local</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.homeGoals}
                    onChange={(e) => setEditForm({ ...editForm, homeGoals: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium">Goles Visitante</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.awayGoals}
                    onChange={(e) => setEditForm({ ...editForm, awayGoals: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              {parseInt(editForm.jornada, 10) >= 4 && (
                <div className="space-y-1">
                  <label className="font-medium">Equipo Clasificado</label>
                  <select
                    value={editForm.qualifyingTeam}
                    onChange={(e) => setEditForm({ ...editForm, qualifyingTeam: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Por definir (TBD)</option>
                    {editForm.homeTeam && <option value={editForm.homeTeam}>{editForm.homeTeam} (Local)</option>}
                    {editForm.awayTeam && <option value={editForm.awayTeam}>{editForm.awayTeam} (Visitante)</option>}
                  </select>
                </div>
              )}

              {formError && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{formError}</p>}
              {formSuccess && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded">{formSuccess}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 border border-input rounded-lg hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
