export type Match = {
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

export const PHASES = [
  "Fase de grupos",
  "Dieciseisavos de final",
  "Octavos de final",
  "Cuartos de final",
  "Semifinales",
  "Tercer puesto",
  "Final",
];

export const JORNADAS = [
  { id: 1, label: "Jornada 1" },
  { id: 2, label: "Jornada 2" },
  { id: 3, label: "Jornada 3" },
  { id: 4, label: "Dieciseisavos de final (J4)" },
  { id: 5, label: "Octavos de final (J5)" },
  { id: 6, label: "Cuartos de final (J6)" },
  { id: 7, label: "Semifinales (J7)" },
  { id: 8, label: "Tercer puesto y Final (J8)" },
];

export const AVAILABLE_FLAGS = [
  { name: "Alemania", path: "/flags/alemania.svg" },
  { name: "Arabia Saudita", path: "/flags/arabia-saudita.svg" },
  { name: "Argelia", path: "/flags/argelia.svg" },
  { name: "Argentina", path: "/flags/argentina.png" },
  { name: "Australia", path: "/flags/australia.svg" },
  { name: "Austria", path: "/flags/austria.svg" },
  { name: "Bélgica", path: "/flags/b-lgica.svg" },
  { name: "Bosnia y Herzegovina", path: "/flags/bosnia-y-herzegovina.svg" },
  { name: "Brasil", path: "/flags/brasil.svg" },
  { name: "Cabo Verde", path: "/flags/cabo-verde.svg" },
  { name: "Canadá", path: "/flags/canad-.svg" },
  { name: "Catar", path: "/flags/catar.svg" },
  { name: "Colombia", path: "/flags/colombia.svg" },
  { name: "Corea del Sur", path: "/flags/corea-del-sur.png" },
  { name: "Costa de Marfil", path: "/flags/costa-de-marfil.svg" },
  { name: "Croacia", path: "/flags/croacia.svg" },
  { name: "Curazao", path: "/flags/curazao.svg" },
  { name: "Ecuador", path: "/flags/ecuador.svg" },
  { name: "Egipto", path: "/flags/egipto.svg" },
  { name: "Escocia", path: "/flags/escocia.svg" },
  { name: "España", path: "/flags/espa-a.svg" },
  { name: "Estados Unidos", path: "/flags/estados-unidos.svg" },
  { name: "Francia", path: "/flags/francia.svg" },
  { name: "Ghana", path: "/flags/ghana.svg" },
  { name: "Haití", path: "/flags/hait-.svg" },
  { name: "Inglaterra", path: "/flags/inglaterra.svg" },
  { name: "Irán", path: "/flags/ir-n.svg" },
  { name: "Irak", path: "/flags/irak.svg" },
  { name: "Japón", path: "/flags/jap-n.svg" },
  { name: "Jordania", path: "/flags/jordania.png" },
  { name: "México", path: "/flags/m-xico.svg" },
  { name: "Marruecos", path: "/flags/marruecos.svg" },
  { name: "Noruega", path: "/flags/noruega.svg" },
  { name: "Nueva Zelanda", path: "/flags/nueva-zelanda.svg" },
  { name: "Países Bajos", path: "/flags/pa-ses-bajos.svg" },
  { name: "Panamá", path: "/flags/panam-.svg" },
  { name: "Paraguay", path: "/flags/paraguay.svg" },
  { name: "Portugal", path: "/flags/portugal.svg" },
  { name: "República Checa", path: "/flags/rep-blica-checa.svg" },
  { name: "R.D. Congo", path: "/flags/rep-blica-democr-tica-del-congo.svg" },
  { name: "Senegal", path: "/flags/senegal.svg" },
  { name: "Sudáfrica", path: "/flags/sud-frica.svg" },
  { name: "Suecia", path: "/flags/suecia.svg" },
  { name: "Suiza", path: "/flags/suiza.svg" },
  { name: "Túnez", path: "/flags/t-nez.svg" },
  { name: "Turquía", path: "/flags/turqu-a.svg" },
  { name: "Uruguay", path: "/flags/uruguay.svg" },
  { name: "Uzbekistán", path: "/flags/uzbekist-n.png" },
];
