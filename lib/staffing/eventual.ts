import { DAYS, type Day } from "@/lib/types";
import type { WeekSchedule } from "@/lib/staffing/types";

/** Valor mostrado en celdas de eventual sin jornada asignada. */
export const EVENTUAL_INACTIVE_LABEL = "ACTIVAR";

/** Sueldo neto por jornada eventual (6 h). */
export const EVENTUAL_SHIFT_NET_SALARY = 60_000;

/** Duración de referencia de cada jornada eventual. */
export const EVENTUAL_SHIFT_HOURS = 6;

export function createEventualWeekSchedule(): WeekSchedule {
  return DAYS.reduce(
    (acc, day) => {
      acc[day] = EVENTUAL_INACTIVE_LABEL;
      return acc;
    },
    {} as WeekSchedule,
  );
}

export function isEventualShiftActive(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed !== "" &&
    trimmed !== EVENTUAL_INACTIVE_LABEL &&
    trimmed !== "FRANCO" &&
    trimmed !== "—"
  );
}

export function countEventualShifts(schedule: WeekSchedule): number {
  return DAYS.filter((day) => isEventualShiftActive(schedule[day])).length;
}

export function computeEventualWeeklyHours(schedule: WeekSchedule): number {
  return countEventualShifts(schedule) * EVENTUAL_SHIFT_HOURS;
}
