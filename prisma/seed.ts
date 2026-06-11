import "dotenv/config";
import { syncMatchesFromFootballData } from "../src/lib/football-data/sync";
import { db } from "../src/lib/db";
import { recalculateAllRankings } from "../src/lib/scoring/ranking-recalc";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Creando usuario administrador...");
  try {
    const existingAdmin = await db.user.findUnique({
      where: { email: "admin@ceroacero.com" },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("Admin1234!", 12);
      await db.user.create({
        data: {
          email: "admin@ceroacero.com",
          passwordHash,
          nickGlobal: "SuperAdmin",
          role: "SUPER_ADMIN",
        },
      });
      console.log("Usuario super admin creado con éxito (admin@ceroacero.com / Admin1234!)");
    } else {
      // Asegurarse de que el usuario existente tenga el rol de super admin
      await db.user.update({
        where: { id: existingAdmin.id },
        data: { role: "SUPER_ADMIN" },
      });
      console.log("El usuario administrador ya existe. Rol verificado.");
    }
  } catch (error) {
    console.error("Error al crear usuario administrador:", error);
  }

  console.log("Iniciando la sincronización de partidos del Mundial 2026...");
  try {
    const result = await syncMatchesFromFootballData();
    console.log("Sincronización completada exitosamente:");
    console.log(`- Partidos sincronizados/actualizados: ${result.matchesSynced}`);
    console.log(`- Partidos finalizados puntuados: ${result.finishedMatchesScored}`);
    console.log(`- Predicciones procesadas: ${result.predictionsProcessed}`);
    console.log("Iniciando la recalculación de rankings...");
    await recalculateAllRankings();
    console.log("Rankings recalculados correctamente.");
  } catch (error) {
    console.error("Error al sincronizar los partidos:", error);
    process.exit(1);
  }
}

main();
