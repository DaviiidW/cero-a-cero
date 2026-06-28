"use client";

import { Match, AVAILABLE_FLAGS, PHASES, JORNADAS } from "../constants";

type EditMatchModalProps = {
  editingMatch: Match | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formError: string | null;
  formSuccess: string | null;
  editForm: {
    homeTeam: string;
    awayTeam: string;
    homeTeamCrest: string;
    awayTeamCrest: string;
    date: string;
    phase: string;
    groupStageNumber: string;
    jornada: string;
    status: string;
    homeGoals: string;
    awayGoals: string;
    qualifyingTeam: string;
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      homeTeam: string;
      awayTeam: string;
      homeTeamCrest: string;
      awayTeamCrest: string;
      date: string;
      phase: string;
      groupStageNumber: string;
      jornada: string;
      status: string;
      homeGoals: string;
      awayGoals: string;
      qualifyingTeam: string;
    }>
  >;
};

export function EditMatchModal({
  editingMatch,
  onClose,
  onSubmit,
  formError,
  formSuccess,
  editForm,
  setEditForm,
}: EditMatchModalProps) {
  if (!editingMatch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Editar Partido</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4 text-sm">
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
              <label className="font-medium">Bandera Local</label>
              <div className="flex gap-2 items-center">
                {editForm.homeTeamCrest && (
                  <img src={editForm.homeTeamCrest} alt="preview" className="h-6 w-9 object-cover rounded border border-muted/50 shrink-0 bg-background" />
                )}
                <select
                  value={AVAILABLE_FLAGS.some(f => f.path === editForm.homeTeamCrest) ? editForm.homeTeamCrest : ""}
                  onChange={(e) => setEditForm({ ...editForm, homeTeamCrest: e.target.value })}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-xs"
                >
                  <option value="">Seleccionar del listado...</option>
                  {AVAILABLE_FLAGS.map((flag) => (
                    <option key={flag.path} value={flag.path}>{flag.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={editForm.homeTeamCrest}
                onChange={(e) => setEditForm({ ...editForm, homeTeamCrest: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-[10px] text-muted-foreground"
                placeholder="O introduce una URL de bandera..."
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium">Bandera Visitante</label>
              <div className="flex gap-2 items-center">
                {editForm.awayTeamCrest && (
                  <img src={editForm.awayTeamCrest} alt="preview" className="h-6 w-9 object-cover rounded border border-muted/50 shrink-0 bg-background" />
                )}
                <select
                  value={AVAILABLE_FLAGS.some(f => f.path === editForm.awayTeamCrest) ? editForm.awayTeamCrest : ""}
                  onChange={(e) => setEditForm({ ...editForm, awayTeamCrest: e.target.value })}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-2 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-xs"
                >
                  <option value="">Seleccionar del listado...</option>
                  {AVAILABLE_FLAGS.map((flag) => (
                    <option key={flag.path} value={flag.path}>{flag.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={editForm.awayTeamCrest}
                onChange={(e) => setEditForm({ ...editForm, awayTeamCrest: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-[10px] text-muted-foreground"
                placeholder="O introduce una URL de bandera..."
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
              onClick={onClose}
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
  );
}
