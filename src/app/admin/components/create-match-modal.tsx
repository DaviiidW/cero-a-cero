"use client";

import { AVAILABLE_FLAGS, PHASES, JORNADAS } from "../constants";

type CreateMatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formError: string | null;
  formSuccess: string | null;
  createForm: {
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
  setCreateForm: React.Dispatch<
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

export function CreateMatchModal({
  isOpen,
  onClose,
  onSubmit,
  formError,
  formSuccess,
  createForm,
  setCreateForm,
}: CreateMatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Añadir Nuevo Partido</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4 text-sm">
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
              <label className="font-medium">Bandera Local</label>
              <div className="flex gap-2 items-center">
                {createForm.homeTeamCrest && (
                  <img src={createForm.homeTeamCrest} alt="preview" className="h-6 w-9 object-cover rounded border border-muted/50 shrink-0 bg-background" />
                )}
                <select
                  value={AVAILABLE_FLAGS.some(f => f.path === createForm.homeTeamCrest) ? createForm.homeTeamCrest : ""}
                  onChange={(e) => setCreateForm({ ...createForm, homeTeamCrest: e.target.value })}
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
                value={createForm.homeTeamCrest}
                onChange={(e) => setCreateForm({ ...createForm, homeTeamCrest: e.target.value })}
                className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 focus:ring-2 focus:ring-ring focus:outline-none text-[10px] text-muted-foreground"
                placeholder="O introduce una URL de bandera..."
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium">Bandera Visitante</label>
              <div className="flex gap-2 items-center">
                {createForm.awayTeamCrest && (
                  <img src={createForm.awayTeamCrest} alt="preview" className="h-6 w-9 object-cover rounded border border-muted/50 shrink-0 bg-background" />
                )}
                <select
                  value={AVAILABLE_FLAGS.some(f => f.path === createForm.awayTeamCrest) ? createForm.awayTeamCrest : ""}
                  onChange={(e) => setCreateForm({ ...createForm, awayTeamCrest: e.target.value })}
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
                value={createForm.awayTeamCrest}
                onChange={(e) => setCreateForm({ ...createForm, awayTeamCrest: e.target.value })}
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
              onClick={onClose}
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
  );
}
