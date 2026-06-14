# ⚽ Cero a Cero — Porra del Mundial de la FIFA 2026

**Cero a Cero** es una plataforma web full-stack para organizar porras (quinielas/predicciones) de partidos de fútbol del Mundial de la FIFA 2026. Los usuarios pueden crear o unirse a grupos privados, pronosticar los marcadores de todas las fases del torneo, acumular puntos según sus aciertos y competir en clasificaciones grupales y globales en tiempo real.

---

## 🚀 Stack Tecnológico

El proyecto está construido sobre un stack moderno y eficiente:

* **Framework Principal:** [Next.js 15](https://nextjs.org/) (App Router) y [React 19](https://react.dev/).
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/).
* **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) (Soporta instancias locales o en la nube como [Neon](https://neon.tech/)).
* **ORM:** [Prisma ORM](https://www.prisma.io/) (para modelado de base de datos y consultas con tipado fuerte).
* **Autenticación:** [NextAuth.js v4](https://next-auth.js.org/) (sesiones seguras y flujo de login/registro).
* **Interfaz de Usuario (UI):** 
  * [Tailwind CSS v4](https://tailwindcss.com/) para diseño responsivo e HSL personalizado.
  * [shadcn/ui](https://ui.shadcn.com/) y [Radix UI](https://www.radix-ui.com/) para componentes de interfaz altamente accesibles y reutilizables.
  * [Lucide React](https://lucide.dev/) para iconos vectoriales.
  * [tw-animate-css](https://github.com/) para micro-animaciones fluidas.
* **Formularios y Validación:** [React Hook Form](https://react-hook-form.com/) y [Zod](https://zod.dev/).
* **Servicio de Correos:** [Resend](https://resend.com/) (para recuperación de contraseñas y notificaciones).
* **Proveedor de Datos Deportivos:** [football-data.org](https://www.football-data.org/) (sincronización automatizada de partidos y resultados en tiempo real).

---

## ✨ Características Principales

1. **Gestión de Grupos:** Creación de grupos privados y sistema de invitaciones mediante enlaces rápidos o códigos de acceso únicos con fecha de expiración.
2. **Predicciones de Partidos:** Pronóstico de goles locales y visitantes para cada encuentro.
   * *Regla de Bloqueo:* Las predicciones se cierran automáticamente **3 minutos antes** del pitido inicial de cada partido para garantizar el juego limpio.
3. **Predicciones Especiales (Torneo):** Pronósticos a largo plazo antes del inicio del torneo (Campeón, Subcampeón, Tercer puesto y Peor equipo) con bonificaciones especiales de puntos.
4. **Sistema de Puntuación Dinámico:**
   * **4 puntos:** Acierto del marcador exacto (Goles del local y visitante correctos).
   * **1 punto:** Acierto del ganador o empate (1X2) pero fallo en el marcador exacto.
   * **0 puntos:** Sin aciertos.
   * **Puntos Especiales:** Puntuaciones adicionales al final del torneo por acertar las predicciones especiales.
5. **Auditoría / Historial de Cambios:** Registro detallado de cada cambio que realiza un usuario en sus predicciones para evitar fraudes y mantener transparencia.
6. **Sincronización en Vivo:** Integración con un cron job en backend para actualizar en tiempo real los marcadores, minutos y estado de los partidos desde `football-data.org`.
7. **Panel de Administración:** Control total para superadministradores para gestionar grupos, usuarios, editar manualmente partidos/resultados y forzar el recalculo de clasificaciones.

---

## 🛠️ Instalación y Configuración Local

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
* [PostgreSQL](https://www.postgresql.org/) (ejecutándose de forma local o en la nube)
* Una API key de [football-data.org](https://www.football-data.org/) (opcional para sincronización automática, pero recomendada)
* Una API key de [Resend](https://resend.com/) (para el envío de correos)

### Pasos para iniciar el proyecto

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/DaviiidW/cero-a-cero.git
   cd cero-a-cero
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Copia el archivo de ejemplo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` recién creado y configura tus credenciales:
   * `DATABASE_URL`: URL de conexión a tu base de datos PostgreSQL.
   * `NEXTAUTH_SECRET`: Clave secreta para encriptar sesiones (puedes generar una con `openssl rand -base64 32`).
   * `RESEND_API_KEY`: API key para enviar correos de restablecimiento de contraseña.
   * `FOOTBALL_DATA_API_TOKEN`: Tu token de football-data.org.
   * `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NICK`: Credenciales del usuario administrador inicial que se creará al sembrar la base de datos.

4. **Preparar la Base de Datos con Prisma:**
   Ejecuta las migraciones de Prisma para modelar las tablas en tu base de datos PostgreSQL:
   ```bash
   npx prisma migrate dev
   ```

5. **Sembrar Datos Iniciales (Seed):**
   Ejecuta el script para sembrar la base de datos con los partidos iniciales del torneo y crear el usuario administrador inicial configurado en tu archivo `.env`:
   ```bash
   npm run build # Genera los clientes de Prisma necesarios
   npx prisma db seed
   ```

6. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 📁 Estructura del Directorio

El proyecto sigue una estructura limpia y moderna recomendada por Next.js:

```text
cero-a-cero/
├── prisma/                  # Esquemas de base de datos y migraciones de Prisma
│   ├── schema.prisma        # Definición de tablas y relaciones de la BD
│   └── seed.ts              # Script para poblar partidos e inicializar admin
├── public/                  # Archivos estáticos públicos (logos, imágenes)
├── src/
│   ├── app/                 # Rutas de la aplicación (App Router)
│   │   ├── api/             # Endpoints del Backend / API Routes de Node.js
│   │   ├── admin/           # Vistas del Tablero de Administración
│   │   ├── grupos/          # Gestión y visualización de grupos
│   │   ├── predicciones/    # Historial de pronósticos del usuario activo
│   │   └── ...              # Vistas de autenticación, perfil, layouts globales
│   ├── components/          # Componentes de React
│   │   ├── ui/              # Componentes base e interactivos de shadcn/ui
│   │   ├── providers/       # Proveedores de contextos globales (Auth, Group)
│   │   └── [feature]/       # Componentes específicos por funcionalidad (auth, matches, ranking)
│   ├── hooks/               # React Hooks personalizados (ej. use-polling)
│   ├── lib/                 # Librerías auxiliares y utilidades de backend
│   │   ├── db.ts            # Cliente Singleton de Prisma
│   │   ├── scoring/         # Lógica de cálculo de puntuaciones y rankings
│   │   └── football-data/   # Sincronización y parsing de partidos externos
│   └── types/               # Tipados de TypeScript
├── vercel.json              # Configuración de despliegue en Vercel
├── package.json             # Dependencias del proyecto y scripts npm
└── tsconfig.json            # Configuración de compilación de TypeScript
```

---

## ⚙️ Scripts Disponibles

* `npm run dev`: Ejecuta el servidor de desarrollo local de Next.js.
* `npm run build`: Compila la aplicación optimizada para producción (primero genera las relaciones de Prisma y luego construye la aplicación).
* `npm run start`: Inicia el servidor de Next.js en producción.
* `npm run lint`: Ejecuta el validador de código ESLint para comprobar consistencia y errores.

---

## 🏆 Reglas del Juego y Puntuaciones

Las reglas detalladas del juego se procesan automáticamente en el backend (ver [`src/lib/scoring`](file:///c:/Users/David/Desktop/cero-a-cero/cero-a-cero/src/lib/scoring)):
1. **Puntajes por Partido:**
   * **Pleno (4 pts):** Pronóstico de goles idéntico al marcador final (ej. Predicción: 2-1, Resultado: 2-1).
   * **Acierto 1X2 (1 pt):** Acierto del ganador o del empate, pero no del marcador exacto (ej. Predicción: 3-0, Resultado: 1-0 [Gana local]; o Predicción: 1-1, Resultado: 2-2 [Empate]).
   * **Fallo (0 pts):** No se acierta ni el ganador/empate ni los goles (ej. Predicción: 0-2, Resultado: 1-0).
2. **Puntajes del Torneo (Especiales):**
   * Se otorgan puntos extra al finalizar el campeonato si el usuario acierta la posición del Campeón, Subcampeón, Tercer Lugar o la predicción del Peor Equipo configurados en su panel del grupo.

