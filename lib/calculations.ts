import { getDayCountsForMonth } from "@/lib/operational-year/getDayCountsForMonth";
import type {
  CalendarDayProjection,
  DashboardParams,
  DashboardResults,
  OperationalCalendar,
} from "./types";
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

/** Reparte enteros conservando el total exacto (mayor resto). */
function distributeIntegerTotal(exactValues: number[], targetTotal: number): number[] {
  const floored = exactValues.map((value) => Math.floor(value));
  let remaining = targetTotal - floored.reduce((sum, value) => sum + value, 0);
  const order = exactValues
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  const distributed = [...floored];
  for (let i = 0; i < remaining; i++) {
    distributed[order[i % order.length].index] += 1;
  }

  return distributed;
}

function emptyWeekdayMonthTotals(): DashboardResults["weekdayMonthTotals"] {
  return DAYS.reduce(
    (acc, day) => {
      acc[day] = { covers: 0, revenue: 0 };
      return acc;
    },
    {} as DashboardResults["weekdayMonthTotals"],
  );
}

const JS_DAY_TO_DAY: Record<number, (typeof DAYS)[number]> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
};

/** Proyecta cubiertos y facturación con calendario real del mes. */
export function calculateDashboard(
  params: DashboardParams,
  calendar: OperationalCalendar,
): DashboardResults {
  const dayCounts = getDayCountsForMonth(calendar.year, calendar.month);
  const daysInMonth = sumValues(dayCounts);

  const coversPerOccurrence = DAYS.reduce(
    (acc, day) => {
      const monthlyShare = params.monthlyCovers * (params.dayPercentages[day] / 100);
      acc[day] = dayCounts[day] > 0 ? monthlyShare / dayCounts[day] : 0;
      return acc;
    },
    {} as DashboardResults["coversByDay"],
  );

  const coversMatrix = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = DAYS.reduce(
        (dayAcc, day) => {
          dayAcc[day] = roundCovers(
            coversPerOccurrence[day] * (params.slotPercentages[slot] / 100),
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
          dayAcc[day] = coversMatrix[slot][day] * params.ticketMatrix[slot][day];
          return dayAcc;
        },
        {} as DashboardResults["revenueMatrix"][typeof slot],
      );
      return acc;
    },
    {} as DashboardResults["revenueMatrix"],
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

  const calendarDays: CalendarDayProjection[] = [];
  const exactDailyCovers: number[] = [];
  const dailyWeekdays: DashboardResults["calendarDays"][number]["weekday"][] = [];

  for (let date = 1; date <= daysInMonth; date++) {
    const weekday = JS_DAY_TO_DAY[new Date(calendar.year, calendar.month - 1, date).getDay()];
    dailyWeekdays.push(weekday);
    exactDailyCovers.push(coversPerOccurrence[weekday]);
  }

  const reconciledDailyCovers = distributeIntegerTotal(
    exactDailyCovers,
    params.monthlyCovers,
  );

  for (let date = 1; date <= daysInMonth; date++) {
    const weekday = dailyWeekdays[date - 1];
    const covers = reconciledDailyCovers[date - 1];
    const revenuePerCover =
      dayTotals[weekday] > 0 ? revenueByDay[weekday] / dayTotals[weekday] : 0;

    calendarDays.push({
      date,
      weekday,
      covers,
      revenue: covers * revenuePerCover,
    });
  }

  const weekdayMonthTotals = emptyWeekdayMonthTotals();
  for (const day of calendarDays) {
    weekdayMonthTotals[day.weekday].covers += day.covers;
    weekdayMonthTotals[day.weekday].revenue += day.revenue;
  }

  const slotTotals = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = sumValues(coversMatrix[slot]);
      return acc;
    },
    {} as DashboardResults["slotTotals"],
  );

  const coversByDay = { ...dayTotals };

  const coversBySlotWeekly = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = sumValues(coversMatrix[slot]);
      return acc;
    },
    {} as DashboardResults["coversBySlotWeekly"],
  );

  const weeklyCoversTotal = sumValues(dayTotals);
  const monthlyCoversTotal = params.monthlyCovers;
  const monthlyRevenue = calendarDays.reduce((sum, day) => sum + day.revenue, 0);

  const revenueBySlotWeekly = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = sumValues(revenueMatrix[slot]);
      return acc;
    },
    {} as DashboardResults["revenueBySlotWeekly"],
  );

  const weeklyRevenue = sumValues(revenueByDay);

  const revenueBySlotMonthly = TIME_SLOTS.reduce(
    (acc, slot) => {
      acc[slot] = DAYS.reduce(
        (total, day) => total + revenueMatrix[slot][day] * dayCounts[day],
        0,
      );
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
    monthlyCoversTotal > 0 ? monthlyRevenue / monthlyCoversTotal : 0;

  const weeklyCovers = daysInMonth > 0 ? (monthlyCoversTotal * 7) / daysInMonth : 0;

  return {
    calendar,
    dayCounts,
    daysInMonth,
    calendarDays,
    weekdayMonthTotals,
    weeklyCovers,
    monthlyCoversTotal,
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
