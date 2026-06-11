import "dotenv/config";
import { syncMatchesFromFootballData } from "../src/lib/football-data/sync";
import { db } from "../src/lib/db";
import { recalculateAllRankings } from "../src/lib/scoring/ranking-recalc";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNick = process.env.ADMIN_NICK ?? "Admin";

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL o ADMIN_PASSWORD no definidos en .env — se omite la creación del admin.");
  } else {
    try {
      const existingAdmin = await db.user.findUnique({
        where: { email: adminEmail },
      });

      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await db.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            nickGlobal: adminNick,
            role: "SUPER_ADMIN",
          },
        });
        console.log(`Usuario super admin creado con éxito (${adminEmail})`);
      } else {
        await db.user.update({
          where: { id: existingAdmin.id },
          data: { role: "SUPER_ADMIN" },
        });
        console.log("El usuario administrador ya existe. Rol verificado.");
      }
    } catch (error) {
      console.error("Error al crear usuario administrador:", error);
    }
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
