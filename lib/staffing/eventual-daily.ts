import type { PayrollEntry } from "@/lib/payroll/types";
import { getPositionProfile } from "@/lib/staffing/position-payroll";
import { EVENTUAL_SHIFT_NET_SALARY } from "@/lib/staffing/eventual";

export type EventualDailyHire = {
  id: string;
  date: number;
  count: number;
};

export type EventualDailyHireRow = EventualDailyHire & {
  netPerShift: number;
  grossPerShift: number;
  totalNet: number;
  totalCcss: number;
  totalCost: number;
};

export type EventualDailySummary = {
  rows: EventualDailyHireRow[];
  totalShifts: number;
  totalNet: number;
  totalCcss: number;
  totalCost: number;
};

export function createEventualDailyHire(date: number, count: number): EventualDailyHire {
  return {
    id: `ev-${date}-${Date.now()}`,
    date,
    count,
  };
}

export function mergeEventualDailyHires(stored?: EventualDailyHire[]): EventualDailyHire[] {
  if (!Array.isArray(stored)) return [];

  const byDate = new Map<number, EventualDailyHire>();
  for (const row of stored) {
    if (!row || typeof row.date !== "number" || row.date < 1 || row.date > 31) continue;
    const count = typeof row.count === "number" && row.count > 0 ? Math.floor(row.count) : 0;
    if (count <= 0) continue;
    byDate.set(row.date, {
      id: typeof row.id === "string" ? row.id : `ev-${row.date}`,
      date: row.date,
      count,
    });
  }

  return [...byDate.values()].sort((a, b) => a.date - b.date);
}

export function computeEventualDailySummary(
  hires: EventualDailyHire[],
  payrollEntries: PayrollEntry[],
): EventualDailySummary {
  const profile = getPositionProfile(payrollEntries, "eventual");
  const netPerShift = profile.netSalary > 0 ? profile.netSalary : EVENTUAL_SHIFT_NET_SALARY;
  const grossPerShift = profile.grossSalary;
  const ccssPerShift = grossPerShift - netPerShift;

  const rows = mergeEventualDailyHires(hires).map((hire) => ({
    ...hire,
    netPerShift,
    grossPerShift,
    totalNet: hire.count * netPerShift,
    totalCcss: hire.count * ccssPerShift,
    totalCost: hire.count * grossPerShift,
  }));

  return {
    rows,
    totalShifts: rows.reduce((sum, row) => sum + row.count, 0),
    totalNet: rows.reduce((sum, row) => sum + row.totalNet, 0),
    totalCcss: rows.reduce((sum, row) => sum + row.totalCcss, 0),
    totalCost: rows.reduce((sum, row) => sum + row.totalCost, 0),
  };
}
