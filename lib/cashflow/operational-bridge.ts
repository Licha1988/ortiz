import { calculateDashboard } from "@/lib/calculations";
import {
  CASHFLOW_MONTHS,
  type CashflowMonthInput,
} from "@/lib/cashflow";
import { OPERATIONAL_YEAR_CATALOG } from "@/lib/operational-year/catalog";
import type { OperationalYearState } from "@/lib/operational-year/types";
import { computeHrOperationalSummary } from "@/lib/staffing/hr-summary";

/** Deriva inputs mensuales del EERR desde el hub operativo (facturación + RRHH por mes). */
export function buildOperationalCashflowMonths(
  state: OperationalYearState,
): CashflowMonthInput[] {
  return OPERATIONAL_YEAR_CATALOG.map((entry, index) => {
    const key = entry.key;
    const params = state.months[key];
    const results = calculateDashboard(params, {
      year: entry.year,
      month: entry.month,
    });
    const hr = computeHrOperationalSummary(
      state.managerTeam[key],
      state.payroll[key],
      results.monthlyRevenue,
      state.eventualDailyHiring[key],
    );

    const covers = params.monthlyCovers;
    const ticket = covers > 0 ? results.monthlyRevenue / covers : 0;

    return {
      month: CASHFLOW_MONTHS[index],
      covers,
      ticket,
      payroll: hr.equipoSubtotal,
      managementCost: hr.managementSubtotal,
    };
  });
}
