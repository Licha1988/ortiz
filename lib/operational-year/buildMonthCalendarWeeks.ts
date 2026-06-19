import type { DashboardResults } from "@/lib/types";
import type { Day } from "@/lib/types";
import { DAYS } from "@/lib/types";

export type CalendarDayCell = {
  date: number;
  weekday: Day;
  covers: number;
  revenue: number;
  isMonthStart: boolean;
  isMonthEnd: boolean;
};

export type CalendarWeek = {
  weekIndex: number;
  days: (CalendarDayCell | null)[];
  weekCovers: number;
  weekRevenue: number;
  containsMonthStart: boolean;
  containsMonthEnd: boolean;
};

export type MonthCalendarBounds = {
  startWeekday: Day;
  startDate: number;
  endWeekday: Day;
  endDate: number;
  weekCount: number;
};

function mondayColumnIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function toCalendarDayCell(
  projection: DashboardResults["calendarDays"][number],
  daysInMonth: number,
): CalendarDayCell {
  return {
    date: projection.date,
    weekday: projection.weekday,
    covers: projection.covers,
    revenue: projection.revenue,
    isMonthStart: projection.date === 1,
    isMonthEnd: projection.date === daysInMonth,
  };
}

/** Arma semanas lun–dom con objetivos por día calendario. */
export function buildMonthCalendarWeeks(results: DashboardResults): CalendarWeek[] {
  const { year, month } = results.calendar;
  const daysInMonth = results.daysInMonth;
  const firstColumn = mondayColumnIndex(new Date(year, month - 1, 1));

  const monthDays = results.calendarDays.map((day) => toCalendarDayCell(day, daysInMonth));
  const weekCount = Math.ceil((firstColumn + daysInMonth) / 7);
  const weeks: CalendarWeek[] = [];

  for (let week = 0; week < weekCount; week++) {
    const days: (CalendarDayCell | null)[] = DAYS.map((_, col) => {
      const index = week * 7 + col - firstColumn;
      return index >= 0 && index < monthDays.length ? monthDays[index] : null;
    });

    const inMonth = days.filter((day): day is CalendarDayCell => day !== null);

    weeks.push({
      weekIndex: week + 1,
      days,
      weekCovers: inMonth.reduce((sum, day) => sum + day.covers, 0),
      weekRevenue: inMonth.reduce((sum, day) => sum + day.revenue, 0),
      containsMonthStart: inMonth.some((day) => day.isMonthStart),
      containsMonthEnd: inMonth.some((day) => day.isMonthEnd),
    });
  }

  return weeks;
}

export function getMonthCalendarBounds(results: DashboardResults): MonthCalendarBounds {
  const first = results.calendarDays[0];
  const last = results.calendarDays[results.calendarDays.length - 1];
  const weeks = buildMonthCalendarWeeks(results);

  if (!first || !last) {
    throw new Error("No se pudo determinar el inicio o fin del mes calendario.");
  }

  return {
    startWeekday: first.weekday,
    startDate: first.date,
    endWeekday: last.weekday,
    endDate: last.date,
    weekCount: weeks.length,
  };
}

export function getCalendarDayProjection(
  results: DashboardResults,
  date: number,
): DashboardResults["calendarDays"][number] | undefined {
  return results.calendarDays.find((day) => day.date === date);
}
