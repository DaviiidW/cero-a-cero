import "./load-env";
import { db } from "./src/lib/db";
import { MatchStatus, ResultType } from "./src/generated/prisma/client";
import { processFinishedMatchScoring } from "./src/lib/scoring/process-match";
import { recalculateAllRankings } from "./src/lib/scoring/ranking-recalc";
import bcrypt from "bcryptjs";

// Helper to calculate result type
function getResultType(home: number, away: number): ResultType {
  if (home > away) return ResultType.HOME;
  if (home < away) return ResultType.AWAY;
  return ResultType.DRAW;
}

async function main() {
  console.log("=== INICIANDO GENERACIÓN DE DATOS DE PRUEBA ===");
  console.log("DATABASE_URL cargado:", JSON.stringify(process.env.DATABASE_URL));

  // 1. Obtener grupos existentes
  const groups = await db.group.findMany();
  if (groups.length === 0) {
    console.log("No se encontraron grupos en la base de datos. Crea uno primero en la UI.");
    return;
  }
  console.log(`Grupos encontrados: ${groups.map(g => g.name).join(", ")}`);

  // 2. Crear usuarios de prueba si no existen
  const testUsersData = [
    { email: "messi@ceroacero.com", nick: "MessiMagic" },
    { email: "cr7@ceroacero.com", nick: "CR7Lover" },
    { email: "neymar@ceroacero.com", nick: "NeymarJr" },
    { email: "mbappe@ceroacero.com", nick: "MbappeSpeed" },
    { email: "haaland@ceroacero.com", nick: "HaalandBeast" },
    { email: "modric@ceroacero.com", nick: "ModricOuter" },
    { email: "kroos@ceroacero.com", nick: "KroosControl" },
    { email: "bellingham@ceroacero.com", nick: "BellinghamStar" }
  ];

  const users = [];
  const passwordHash = await bcrypt.hash("password123", 12);

  for (const userData of testUsersData) {
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { nickGlobal: userData.nick }
        ]
      }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: userData.email,
          nickGlobal: userData.nick,
          passwordHash,
        }
      });
      console.log(`Usuario creado: ${userData.nick} (${userData.email})`);
    } else {
      console.log(`Usuario existente: ${user.nickGlobal} (${user.email})`);
    }
    users.push(user);
  }

  // 3. Añadir usuarios a todos los grupos
  for (const group of groups) {
    for (const user of users) {
      const existingMember = await db.member.findUnique({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: group.id
          }
        }
      });

      if (!existingMember) {
        await db.member.create({
          data: {
            userId: user.id,
            groupId: group.id,
            nick: user.nickGlobal,
          }
        });
        console.log(`Añadido ${user.nickGlobal} al grupo ${group.name}`);
      }
    }
  }

  // 4. Obtener partidos en la base de datos
  const allMatches = await db.match.findMany({
    orderBy: { date: "asc" }
  });

  if (allMatches.length === 0) {
    console.log("No hay partidos en la base de datos. Sincroniza o crea partidos primero.");
    return;
  }
  console.log(`Partidos encontrados en BD: ${allMatches.length}`);

  // Obtener equipos únicos del torneo
  const teams = Array.from(new Set(allMatches.flatMap(m => [m.homeTeam, m.awayTeam])));
  console.log(`Equipos en el torneo: ${teams.length}`);

  // 5. Crear predicciones especiales (podios) para todos los usuarios en cada grupo
  for (const group of groups) {
    for (const user of users) {
      // Elegir equipos al azar para el podio
      const shuffled = [...teams].sort(() => 0.5 - Math.random());
      const champion = shuffled[0] || "España";
      const runnerUp = shuffled[1] || "Francia";
      const thirdPlace = shuffled[2] || "Argentina";
      const worstTeam = shuffled[shuffled.length - 1] || "Arabia Saudita";

      await db.tournamentPrediction.upsert({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: group.id
          }
        },
        create: {
          userId: user.id,
          groupId: group.id,
          champion,
          runnerUp,
          thirdPlace,
          worstTeam,
        },
        update: {
          champion,
          runnerUp,
          thirdPlace,
          worstTeam,
        }
      });
    }
    console.log(`Predicciones especiales de podio creadas en grupo: ${group.name}`);
  }

  // 6. Marcar algunos partidos como finalizados y crear predicciones para ellos
  // Vamos a tomar partidos de diferentes jornadas y finalizarlos.
  // Seleccionamos:
  // - 4 partidos de la Jornada 1 (jornada = 1)
  // - 4 partidos de la Jornada 2 (jornada = 2)
  // - 4 partidos de la Jornada 3 (jornada = 3)
  // - 2 partidos de Octavos (jornada = 5)
  // - 2 partidos de Cuartos (jornada = 6)
  
  const matchesToFinish = allMatches.filter(m => [1, 2, 3, 5, 6].includes(m.jornada)).slice(0, 16);

  console.log(`Finalizando ${matchesToFinish.length} partidos y creando predicciones para los mismos...`);

  for (const match of matchesToFinish) {
    // Definir marcador real aleatorio para el partido
    const realHome = Math.floor(Math.random() * 4); // 0-3
    const realAway = Math.floor(Math.random() * 4); // 0-3

    // Actualizar partido
    await db.match.update({
      where: { id: match.id },
      data: {
        status: MatchStatus.FINISHED,
        homeGoals: realHome,
        awayGoals: realAway,
      }
    });

    // Crear predicciones para cada usuario en cada grupo
    for (const group of groups) {
      for (const user of users) {
        // Marcador predecido aleatoriamente
        const predHome = Math.floor(Math.random() * 4);
        const predAway = Math.floor(Math.random() * 4);

        await db.prediction.upsert({
          where: {
            userId_matchId_groupId: {
              userId: user.id,
              matchId: match.id,
              groupId: group.id
            }
          },
          create: {
            userId: user.id,
            matchId: match.id,
            groupId: group.id,
            predictionHomeGoals: predHome,
            predictionAwayGoals: predAway,
            resultType: getResultType(predHome, predAway),
            scoredAt: null // se procesará después
          },
          update: {
            predictionHomeGoals: predHome,
            predictionAwayGoals: predAway,
            resultType: getResultType(predHome, predAway),
            scoredAt: null
          }
        });
      }
    }

    // Procesar puntuaciones del partido para calcular pointsEarned y actualizar la tabla Points
    const result = await processFinishedMatchScoring(match.id, false);
    console.log(`Partido ${match.homeTeam} vs ${match.awayTeam} (Jornada ${match.jornada}) finalizado ${realHome}-${realAway}. Predicciones evaluadas: ${result.processed}`);
  }

  console.log("Recalculando todas las clasificaciones y rankings...");
  await recalculateAllRankings();

  console.log("=== GENERACIÓN DE DATOS DE PRUEBA COMPLETADA CON ÉXITO ===");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
