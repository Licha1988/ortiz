import { CCSS_RATE, MANAGEMENT_ROLE_IDS } from "./data";
import type {
  PayrollEntry,
  PayrollRowComputed,
  PayrollRoleId,
  PayrollSummary,
} from "./types";
import type { RequiredHeadcount } from "@/lib/staffing/types";

/**
 * Maps staffing module required headcount (which splits AM/PM per role) into
 * payroll role IDs (which unify shifts). Each entry represents the total number
 * of people you need to pay, regardless of which shift they cover.
 */
export function staffingToPayrollSuggestions(
  required: RequiredHeadcount,
): Partial<Record<PayrollRoleId, number>> {
  // AM kitchen despacho helpers: FUE_AM + GUAR_AM + FREI_AM (staffing module)
  const amDespacho = required.FUE_AM + required.GUAR_AM + required.FREI_AM;
  // PM kitchen helpers: PAR_PM + FUE_PM + GUAR_PM + FREI_PM
  const pmDespacho = required.PAR_PM + required.FUE_PM + required.GUAR_PM + required.FREI_PM;

  return {
    // Gestión operativa — always 1
    DIR_OP:  1,
    CHEF_EJ: 1,
    ADMIN:   1,
    // FOH — combined across shifts
    GERENTE:       Math.max(1, required.GER),
    ENC_TURNO:     Math.max(1, required.ENC),
    CAJERO:        Math.max(1, required.CAJ_AM + required.CAJ_PM),
    JEFE_SALON:    required.JFS_AM + required.JFS_PM,
    CAMARERO_AM:   Math.max(1, required.cam_am),
    CAMARERO_PM:   Math.max(1, required.cam_pm),
    RUNNER_COMIS:  required.CR,
    BARRA_BARISTA: Math.max(1, required.BC),
    // BOH — combined across shifts
    JEFE_COCINA:     Math.max(1, required.JEFE_COC_AM + required.JEFE_COC_PM),
    PROD_AM:         required.PAR_AM > 0 ? 1 : 0, // PAR_AM = 1 producción fija
    AYUDANTE_COC_AM: amDespacho,
    AYUDANTE_COC_PM: pmDespacho,
    BACHA:           required.BACH_AM + required.BACH_PM,
  };
}

export function computeRow(
  entry: PayrollEntry,
  suggestedQty: number,
): PayrollRowComputed {
  const ccss = entry.hasCCSS ? Math.round(entry.netSalary * CCSS_RATE) : 0;
  const grossSalary = entry.netSalary + ccss;
  const rowTotal = grossSalary * entry.quantity;
  const suggestedRowTotal = grossSalary * suggestedQty;
  return {
    ...entry,
    ccss,
    grossSalary,
    rowTotal,
    suggestedQty,
    suggestedRowTotal,
    qtyDelta: suggestedQty - entry.quantity,
    costDelta: suggestedRowTotal - rowTotal,
  };
}

export function computePayrollSummary(
  entries: PayrollEntry[],
  suggestions: Partial<Record<PayrollRoleId, number>>,
  monthlyRevenue: number,
): PayrollSummary {
  const rows = entries.map((entry) =>
    computeRow(entry, suggestions[entry.roleId] ?? entry.quantity),
  );

  const totalPayroll = rows.reduce((sum, r) => sum + r.rowTotal, 0);
  const totalNet    = rows.reduce((sum, r) => sum + r.netSalary * r.quantity, 0);
  const totalCCSS   = rows.reduce((sum, r) => sum + r.ccss * r.quantity, 0);

  // Separación costo de gestión vs costo de equipo
  // Uses roleId (not the optional isManagement flag) so it's robust to stale state.
  const managementRows = rows.filter((r) => MANAGEMENT_ROLE_IDS.has(r.roleId));
  const equipoRows     = rows.filter((r) => !MANAGEMENT_ROLE_IDS.has(r.roleId));
  const managementSubtotal = managementRows.reduce((sum, r) => sum + r.rowTotal, 0);
  const equipoSubtotal     = equipoRows.reduce((sum, r) => sum + r.rowTotal, 0);

  // Suggested: sólo sobre equipo (gestión siempre es fija)
  const suggestedPayroll    = equipoRows.reduce((sum, r) => sum + r.suggestedRowTotal, 0);
  const suggestedHeadcount  = equipoRows.reduce((sum, r) => sum + r.suggestedQty, 0);
  const contractedHeadcount = equipoRows.reduce((sum, r) => sum + r.quantity, 0);
  const payrollGap          = suggestedPayroll - equipoSubtotal;
  const headcountGap        = suggestedHeadcount - contractedHeadcount;

  const byCategory = (cat: PayrollEntry["category"]) =>
    rows.filter((r) => r.category === cat).reduce((sum, r) => sum + r.rowTotal, 0);

  const managementToRevenuePercent =
    monthlyRevenue > 0 ? (managementSubtotal / monthlyRevenue) * 100 : 0;
  const equipoToRevenuePercent =
    monthlyRevenue > 0 ? (equipoSubtotal / monthlyRevenue) * 100 : 0;
  const payrollToRevenuePercent =
    monthlyRevenue > 0 ? (totalPayroll / monthlyRevenue) * 100 : 0;
  const suggestedToRevenuePercent =
    monthlyRevenue > 0 ? (suggestedPayroll / monthlyRevenue) * 100 : 0;

  return {
    totalPayroll,
    totalNet,
    totalCCSS,
    fohSubtotal: byCategory("foh"),
    bohSubtotal: byCategory("boh"),
    direccionSubtotal: byCategory("direccion"),
    managementSubtotal,
    equipoSubtotal,
    managementToRevenuePercent,
    equipoToRevenuePercent,
    payrollToRevenuePercent,
    rows,
    suggestedPayroll,
    suggestedHeadcount,
    contractedHeadcount,
    payrollGap,
    headcountGap,
    suggestedToRevenuePercent,
  };
}

export function payrollHealthColor(percent: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (percent <= 30) return { bg: "bg-emerald-600", text: "text-white", label: "Saludable" };
  if (percent <= 40) return { bg: "bg-amber-500", text: "text-white", label: "Atención" };
  return { bg: "bg-red-600", text: "text-white", label: "Crítico" };
}
