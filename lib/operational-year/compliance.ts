import type { DayActuals, MonthActuals } from "@/lib/operational-year/actuals";
import { getDayActual } from "@/lib/operational-year/actuals";
import type { CalendarWeek } from "@/lib/operational-year/buildMonthCalendarWeeks";
import type { CalendarDayProjection } from "@/lib/types";

export function compliancePercent(actual: number, target: number): number | null {
  if (target <= 0) {
    return actual > 0 ? 100 : null;
  }
  return (actual / target) * 100;
}

/** Promedio de cumplimiento cubiertos + venta cuando hay datos reales. */
export function dayObjectiveCompliance(
  targetCovers: number,
  targetRevenue: number,
  actual: DayActuals,
): number | null {
  const parts: number[] = [];

  if (actual.covers != null) {
    const pct = compliancePercent(actual.covers, targetCovers);
    if (pct != null) parts.push(pct);
  }
  if (actual.revenue != null) {
    const pct = compliancePercent(actual.revenue, targetRevenue);
    if (pct != null) parts.push(pct);
  }

  if (parts.length === 0) return null;
  return parts.reduce((sum, value) => sum + value, 0) / parts.length;
}

export function aggregateObjectiveCompliance(
  targetCovers: number,
  targetRevenue: number,
  actualCovers: number,
  actualRevenue: number,
  hasCoversData: boolean,
  hasRevenueData: boolean,
): number | null {
  const parts: number[] = [];

  if (hasCoversData) {
    const pct = compliancePercent(actualCovers, targetCovers);
    if (pct != null) parts.push(pct);
  }
  if (hasRevenueData) {
    const pct = compliancePercent(actualRevenue, targetRevenue);
    if (pct != null) parts.push(pct);
  }

  if (parts.length === 0) return null;
  return parts.reduce((sum, value) => sum + value, 0) / parts.length;
}

export type WeekActualsSummary = {
  targetCovers: number;
  targetRevenue: number;
  actualCovers: number;
  actualRevenue: number;
  hasCoversData: boolean;
  hasRevenueData: boolean;
};

export function summarizeWeekActuals(
  week: CalendarWeek,
  actuals: MonthActuals,
): WeekActualsSummary {
  return week.days.reduce<WeekActualsSummary>(
    (acc, day) => {
      if (!day) return acc;

      acc.targetCovers += day.covers;
      acc.targetRevenue += day.revenue;

      const actual = getDayActual(actuals, day.date);
      if (actual.covers != null) {
        acc.actualCovers += actual.covers;
        acc.hasCoversData = true;
      }
      if (actual.revenue != null) {
        acc.actualRevenue += actual.revenue;
        acc.hasRevenueData = true;
      }

      return acc;
    },
    {
      targetCovers: 0,
      targetRevenue: 0,
      actualCovers: 0,
      actualRevenue: 0,
      hasCoversData: false,
      hasRevenueData: false,
    },
  );
}

export function formatCompliance(pct: number): string {
  return `${Math.round(pct)}%`;
}

export function objectiveComplianceTone(pct: number): string {
  if (pct >= 100) return "bg-emerald-100 text-emerald-800";
  if (pct >= 85) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-800";
}

export type MonthProgressSummary = {
  progressDay: number;
  targetCovers: number;
  targetRevenue: number;
  targetTicket: number | null;
  actualCovers: number;
  actualRevenue: number;
  actualTicket: number | null;
  hasCoversData: boolean;
  hasRevenueData: boolean;
  coversCompliance: number | null;
  revenueCompliance: number | null;
  ticketCompliance: number | null;
};

/** Acumulado objetivo vs real hasta el último día con datos cargados. */
export function summarizeMonthProgress(
  calendarDays: CalendarDayProjection[],
  actuals: MonthActuals,
): MonthProgressSummary | null {
  let progressDay = 0;

  for (const [key, day] of Object.entries(actuals)) {
    const date = Number(key);
    if (!Number.isInteger(date) || date < 1) continue;
    if (day.covers != null || day.revenue != null) {
      progressDay = Math.max(progressDay, date);
    }
  }

  if (progressDay === 0) return null;

  let targetCovers = 0;
  let targetRevenue = 0;
  let actualCovers = 0;
  let actualRevenue = 0;
  let hasCoversData = false;
  let hasRevenueData = false;

  for (const day of calendarDays) {
    if (day.date > progressDay) break;

    targetCovers += day.covers;
    targetRevenue += day.revenue;

    const actual = getDayActual(actuals, day.date);
    if (actual.covers != null) {
      actualCovers += actual.covers;
      hasCoversData = true;
    }
    if (actual.revenue != null) {
      actualRevenue += actual.revenue;
      hasRevenueData = true;
    }
  }

  const targetTicket = targetCovers > 0 ? targetRevenue / targetCovers : null;
  const actualTicket =
    hasCoversData && actualCovers > 0 ? actualRevenue / actualCovers : null;

  return {
    progressDay,
    targetCovers,
    targetRevenue,
    targetTicket,
    actualCovers,
    actualRevenue,
    actualTicket,
    hasCoversData,
    hasRevenueData,
    coversCompliance: hasCoversData
      ? compliancePercent(actualCovers, targetCovers)
      : null,
    revenueCompliance: hasRevenueData
      ? compliancePercent(actualRevenue, targetRevenue)
      : null,
    ticketCompliance:
      hasCoversData && hasRevenueData && actualTicket != null && targetTicket != null
        ? compliancePercent(actualTicket, targetTicket)
        : null,
  };
}
