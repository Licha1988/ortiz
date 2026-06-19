import type { Day } from "@/lib/types";
import { DAYS } from "@/lib/types";

const JS_DAY_TO_DAY: Record<number, Day> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
};

function emptyDayCounts(): Record<Day, number> {
  return DAYS.reduce(
    (acc, day) => {
      acc[day] = 0;
      return acc;
    },
    {} as Record<Day, number>,
  );
}

/**
 * Cuenta cuántas veces aparece cada día de la semana en un mes calendario.
 *
 * @param year Año calendario (ej. 2025)
 * @param month Mes calendario 1–12 (enero = 1, agosto = 8)
 */
export function getDayCountsForMonth(year: number, month: number): Record<Day, number> {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Mes inválido: year=${year}, month=${month}. Usá month entre 1 y 12.`);
  }

  const counts = emptyDayCounts();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    counts[JS_DAY_TO_DAY[weekday]] += 1;
  }

  return counts;
}
