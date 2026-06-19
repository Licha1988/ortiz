import { DEFAULT_PARAMS } from "@/lib/defaults";
import type { DashboardParams, TicketMatrix } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";

export function cloneDashboardParams(params: DashboardParams = DEFAULT_PARAMS): DashboardParams {
  return {
    monthlyCovers: params.monthlyCovers,
    dayPercentages: { ...params.dayPercentages },
    slotPercentages: { ...params.slotPercentages },
    ticketMatrix: TIME_SLOTS.reduce(
      (acc, slot) => {
        acc[slot] = { ...params.ticketMatrix[slot] };
        return acc;
      },
      {} as TicketMatrix,
    ),
  };
}

export function mergeMonthParams(stored?: Partial<DashboardParams>): DashboardParams {
  const base = cloneDashboardParams(DEFAULT_PARAMS);

  if (!stored) {
    return base;
  }

  return {
    monthlyCovers: stored.monthlyCovers ?? base.monthlyCovers,
    dayPercentages: { ...base.dayPercentages, ...stored.dayPercentages },
    slotPercentages: { ...base.slotPercentages, ...stored.slotPercentages },
    ticketMatrix: TIME_SLOTS.reduce(
      (acc, slot) => {
        acc[slot] = {
          ...base.ticketMatrix[slot],
          ...stored.ticketMatrix?.[slot],
        };
        return acc;
      },
      {} as TicketMatrix,
    ),
  };
}

/** Valida que el ticket matrix tenga todas las franjas y días esperados. */
export function isCompleteTicketMatrix(value: unknown): value is DashboardParams["ticketMatrix"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  return TIME_SLOTS.every((slot) => {
    const row = (value as DashboardParams["ticketMatrix"])[slot];
    return row && DAYS.every((day) => typeof row[day] === "number");
  });
}
