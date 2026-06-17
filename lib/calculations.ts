import { WEEKS_PER_MONTH } from "./defaults";
import type { DashboardParams, DashboardResults } from "./types";
import { DAYS, TIME_SLOTS } from "./types";

export function sumValues(values: Record<string, number>): number {
  return Object.values(values).reduce((acc, value) => acc + value, 0);
}

function roundCovers(value: number): number {
  return Math.round(value);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function calculateDashboard(params: DashboardParams): DashboardResults {
  const weeklyCovers = params.monthlyCovers / WEEKS_PER_MONTH;

  const coversByDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = weeklyCovers * (params.dayPercentages[day] / 100);
      return acc;
    },
    {} as DashboardResults["coversByDay"],
  );

  const coversBySlotWeekly = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = weeklyCovers * (params.slotPercentages[slot] / 100);
      return acc;
    },
    {} as DashboardResults["coversBySlotWeekly"],
  );

  const coversMatrix = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = DAYS.reduce(
        (dayAcc, day) => {
          dayAcc[day] = roundCovers(
            weeklyCovers *
              (params.dayPercentages[day] / 100) *
              (params.slotPercentages[slot] / 100),
          );
          return dayAcc;
        },
        {} as DashboardResults["coversMatrix"][typeof slot],
      );
      return acc;
    },
    {} as DashboardResults["coversMatrix"],
  );

  const revenueMatrix = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = DAYS.reduce(
        (dayAcc, day) => {
          dayAcc[day] =
            coversMatrix[slot][day] * params.ticketMatrix[slot][day];
          return dayAcc;
        },
        {} as DashboardResults["revenueMatrix"][typeof slot],
      );
      return acc;
    },
    {} as DashboardResults["revenueMatrix"],
  );

  const slotTotals = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = sumValues(coversMatrix[slot]);
      return acc;
    },
    {} as DashboardResults["slotTotals"],
  );

  const dayTotals = DAYS.reduce(
    (acc, day) => {
      acc[day] = TIME_SLOTS.reduce(
        (total, slot) => total + coversMatrix[slot][day],
        0,
      );
      return acc;
    },
    {} as DashboardResults["dayTotals"],
  );

  const weeklyCoversTotal = sumValues(dayTotals);

  const revenueByDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = TIME_SLOTS.reduce(
        (total, slot) => total + revenueMatrix[slot][day],
        0,
      );
      return acc;
    },
    {} as DashboardResults["revenueByDay"],
  );

  const revenueBySlotWeekly = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = sumValues(revenueMatrix[slot]);
      return acc;
    },
    {} as DashboardResults["revenueBySlotWeekly"],
  );

  const weeklyRevenue = sumValues(revenueByDay);
  const monthlyRevenue = weeklyRevenue * WEEKS_PER_MONTH;

  const revenueBySlotMonthly = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = revenueBySlotWeekly[slot] * WEEKS_PER_MONTH;
      return acc;
    },
    {} as DashboardResults["revenueBySlotMonthly"],
  );

  const ticketAverageBySlot = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = average(DAYS.map((day) => params.ticketMatrix[slot][day]));
      return acc;
    },
    {} as DashboardResults["ticketAverageBySlot"],
  );

  const weightedAvgTicket =
    weeklyCoversTotal > 0 ? weeklyRevenue / weeklyCoversTotal : 0;

  return {
    weeklyCovers,
    monthlyRevenue,
    weeklyRevenue,
    weightedAvgTicket,
    ticketAverageBySlot,
    coversByDay,
    revenueByDay,
    revenueBySlotWeekly,
    revenueBySlotMonthly,
    coversBySlotWeekly,
    coversMatrix,
    revenueMatrix,
    slotTotals,
    dayTotals,
    weeklyCoversTotal,
  };
}
