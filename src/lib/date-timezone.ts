/**
 * Convierte una cadena de fecha sin zona horaria (ej: "2026-06-11T21:00")
 * interpretándola en la zona horaria de España ("Europe/Madrid") a un objeto Date (UTC).
 * Si la cadena ya viene con indicador de zona horaria (Z o +offset), se parsea normalmente.
 */
export function parseMadridTimeToUTC(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  if (!dateInput) return new Date();

  // Si la cadena ya contiene información de zona horaria, se parsea directamente
  if (dateInput.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(dateInput)) {
    return new Date(dateInput);
  }

  // Si no tiene zona horaria (formato de datetime-local, ej. "2026-06-11T21:00"),
  // asumimos que es hora de España ("Europe/Madrid") y la convertimos a UTC.
  const utcDate = new Date(dateInput + ":00.000Z");
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)!.value, 10);

  const formattedYear = getPart("year");
  const formattedMonth = getPart("month");
  const formattedDay = getPart("day");
  const formattedHour = getPart("hour");
  const formattedMinute = getPart("minute");

  const targetDate = new Date(Date.UTC(
    formattedYear,
    formattedMonth - 1,
    formattedDay,
    formattedHour,
    formattedMinute
  ));

  const diffMs = targetDate.getTime() - utcDate.getTime();
  return new Date(utcDate.getTime() - diffMs);
}

/**
 * Convierte un objeto Date (o cadena UTC) a una cadena de texto en formato local de España
 * compatible con inputs "datetime-local" ("YYYY-MM-DDTHH:mm").
 */
export function formatUTCtoMadridTime(dateInput: Date | string): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find(p => p.type === type)!.value;

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  
  const minute = getPart("minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}
