import { syncMatchesFromFootballData } from "../src/lib/football-data/sync";

async function main() {
  console.log("Iniciando la sincronización de partidos del Mundial 2026...");
  try {
    const result = await syncMatchesFromFootballData();
    console.log("Sincronización completada exitosamente:");
    console.log(`- Partidos sincronizados/actualizados: ${result.matchesSynced}`);
    console.log(`- Partidos finalizados puntuados: ${result.finishedMatchesScored}`);
    console.log(`- Predicciones procesadas: ${result.predictionsProcessed}`);
  } catch (error) {
    console.error("Error al sincronizar los partidos:", error);
    process.exit(1);
  }
}

main();
