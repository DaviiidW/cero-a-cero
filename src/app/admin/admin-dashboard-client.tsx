"use client";

import { useState, useEffect } from "react";
import { formatScore } from "@/lib/scoring/labels";
import { formatUTCtoMadridTime } from "@/lib/date-timezone";
import { Match, AVAILABLE_FLAGS, PHASES, JORNADAS } from "./constants";
import { CreateMatchModal } from "./components/create-match-modal";
import { EditMatchModal } from "./components/edit-match-modal";

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


  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [recalculatingMatches, setRecalculatingMatches] = useState(false);
  const [recalculatingSpecials, setRecalculatingSpecials] = useState(false);

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

  const handleRecalculateGroupRanking = async (type: "matches" | "specials") => {
    if (!selectedGroupId) return;
    const groupName = groups.find((g) => g.id === selectedGroupId)?.name || "este grupo";
    const actionText = type === "matches" ? "predicciones de partidos" : "predicciones especiales";
    if (!confirm(`¿Estás seguro de que deseas recalcular los puntos de ${actionText} del grupo "${groupName}"?`)) {
      return;
    }
    if (type === "matches") setRecalculatingMatches(true);
    else setRecalculatingSpecials(true);

    try {
      const response = await fetch("/api/admin/recalculate-group-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId, type }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al recalcular.");
      }
      alert(data.message || "Puntos recalculados con éxito.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al recalcular.");
    } finally {
      if (type === "matches") setRecalculatingMatches(false);
      else setRecalculatingSpecials(false);
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
            {groups.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 select-none">
                    🎯 Recalcular Grupo Seleccionado
                  </h3>
                  <p className="text-xs text-muted-foreground select-none">
                    Recalcula por separado los puntos de partidos o especiales de un grupo específico.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecalculateGroupRanking("matches")}
                      disabled={recalculatingMatches || recalculatingSpecials || !selectedGroupId}
                      className="flex-1 px-3 py-2 text-[11px] font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition disabled:opacity-50 cursor-pointer text-center"
                    >
                      {recalculatingMatches ? "Recalculando..." : "Recalcular Partidos"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecalculateGroupRanking("specials")}
                      disabled={recalculatingMatches || recalculatingSpecials || !selectedGroupId}
                      className="flex-1 px-3 py-2 text-[11px] font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition disabled:opacity-50 cursor-pointer text-center"
                    >
                      {recalculatingSpecials ? "Recalculando..." : "Recalcular Especiales"}
                    </button>
                  </div>
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

      <CreateMatchModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
        formError={formError}
        formSuccess={formSuccess}
        createForm={createForm}
        setCreateForm={setCreateForm}
      />

      <EditMatchModal
        editingMatch={editingMatch}
        onClose={() => setEditingMatch(null)}
        onSubmit={handleEditSubmit}
        formError={formError}
        formSuccess={formSuccess}
        editForm={editForm}
        setEditForm={setEditForm}
      />
    </div>
  );
}
