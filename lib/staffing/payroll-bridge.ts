import { DEFAULT_PAYROLL_ENTRIES } from "@/lib/payroll/data";
import { computeEntryGross } from "@/lib/payroll/ccss";
import type { PayrollEntry, PayrollRoleId } from "@/lib/payroll/types";
import {
  countEventualShifts,
  EVENTUAL_SHIFT_NET_SALARY,
} from "@/lib/staffing/eventual";
import { getPositionProfile } from "@/lib/staffing/position-payroll";
import {
  getPositionForStaffRole,
  getPositionForPayrollRole,
  getPositionLabel,
  type StaffPosition,
} from "@/lib/staffing/positions";
import { getMemberShiftGroup } from "@/lib/staffing/schedules";
import type { StaffMember, StaffRoleType } from "@/lib/staffing/types";

const PAYROLL_DEFAULTS = new Map(
  DEFAULT_PAYROLL_ENTRIES.map((entry) => [entry.roleId, entry]),
);

const STAFF_TO_PAYROLL: Partial<Record<StaffRoleType, PayrollRoleId>> = {
  LIS: "DIR_OP",
  BRUNO: "CHEF_EJ",
  GER: "GERENTE",
  ADMIN: "ADMIN",
  ENC: "ENC_TURNO",
  CAJ_AM: "CAJERO",
  CAJ_PM: "CAJERO",
  JFS_AM: "JEFE_SALON",
  JFS_PM: "JEFE_SALON",
  REC_PM: "JEFE_SALON",
  CAM: "CAMARERO_AM",
  CR: "RUNNER_COMIS",
  CE: "EVENTUAL",
  BC: "BARRA_BARISTA",
  JEFE_COC_AM: "JEFE_COCINA",
  JEFE_COC_PM: "JEFE_COCINA",
  PAR_AM: "PROD_AM",
  FUE_AM: "AYUDANTE_COC_AM",
  GUAR_AM: "AYUDANTE_COC_AM",
  FREI_AM: "AYUDANTE_COC_AM",
  BACH_AM: "BACHA",
  PAR_PM: "AYUDANTE_COC_PM",
  FUE_PM: "AYUDANTE_COC_PM",
  GUAR_PM: "AYUDANTE_COC_PM",
  FREI_PM: "AYUDANTE_COC_PM",
  BACH_PM: "BACHA",
};

export type MemberPayrollCost = {
  netSalary: number;
  ccss: number;
  totalCost: number;
  hasCCSS: boolean;
};

export type RosterAreaKey = "gestion" | "direccion" | "salon" | "cocina";

export type RosterAreaBreakdownRow = {
  area: RosterAreaKey;
  label: string;
  people: number;
  monthlyCost: number;
  payrollPercent: number;
  revenuePercent: number;
};

export type PayrollComparisonRow = {
  roleId: PayrollRoleId;
  label: string;
  contracted: number;
  suggested: number;
  difference: number;
  impact: number;
  grossSalary: number;
};

const ROSTER_AREA_LABELS: Record<RosterAreaKey, string> = {
  gestion: "Gestión operativa",
  direccion: "Dirección y Admin",
  salon: "Salón",
  cocina: "Cocina",
};

export function getPayrollRoleForStaffMember(member: StaffMember): PayrollRoleId | undefined {
  if (member.roleType === "CAM") {
    return getMemberShiftGroup(member) === "pm" ? "CAMARERO_PM" : "CAMARERO_AM";
  }
  return STAFF_TO_PAYROLL[member.roleType];
}

export function getPayrollEntryForStaffMember(
  member: StaffMember,
  entries: PayrollEntry[] = DEFAULT_PAYROLL_ENTRIES,
): PayrollEntry | undefined {
  const roleId = getPayrollRoleForStaffMember(member);
  if (!roleId) return undefined;
  return entries.find((entry) => entry.roleId === roleId);
}

export function resolveMemberPosition(member: StaffMember): StaffPosition {
  return member.position ?? getPositionForStaffRole(member.roleType);
}

export function getDefaultNetSalaryForStaffRole(
  roleType: StaffRoleType,
  entries: PayrollEntry[] = DEFAULT_PAYROLL_ENTRIES,
): number {
  if (roleType === "CAM") {
    return entries.find((entry) => entry.roleId === "CAMARERO_AM")?.netSalary ?? 0;
  }
  const roleId = STAFF_TO_PAYROLL[roleType];
  if (!roleId) return 0;
  return entries.find((entry) => entry.roleId === roleId)?.netSalary ?? 0;
}

export function memberHasCCSS(
  member: StaffMember,
  entries: PayrollEntry[] = DEFAULT_PAYROLL_ENTRIES,
): boolean {
  return getPositionProfile(entries, resolveMemberPosition(member)).hasCCSS;
}

export function resolveMemberNetSalary(
  member: StaffMember,
  entries: PayrollEntry[] = DEFAULT_PAYROLL_ENTRIES,
): number {
  const position = resolveMemberPosition(member);
  return getPositionProfile(entries, position).netSalary;
}

export function computeMemberPayrollCost(
  member: StaffMember,
  entries: PayrollEntry[] = DEFAULT_PAYROLL_ENTRIES,
): MemberPayrollCost {
  const position = resolveMemberPosition(member);
  const profile = getPositionProfile(entries, position);

  if (position === "eventual") {
    const shiftNet = profile.netSalary > 0 ? profile.netSalary : EVENTUAL_SHIFT_NET_SALARY;
    const shifts = countEventualShifts(member.schedule);
    const netSalary = shifts * shiftNet;
    const ccssRate = profile.hasCCSS ? profile.ccssRate : 0;
    const ccss = netSalary * ccssRate;
    return {
      netSalary,
      ccss,
      totalCost: netSalary + ccss,
      hasCCSS: profile.hasCCSS,
    };
  }

  return {
    netSalary: profile.netSalary,
    ccss: profile.ccss,
    totalCost: profile.grossSalary,
    hasCCSS: profile.hasCCSS,
  };
}

export function getRosterAreaForMember(member: StaffMember): RosterAreaKey {
  if (member.roleType === "LIS" || member.roleType === "BRUNO") return "gestion";
  if (member.roleType === "GER" || member.roleType === "ADMIN") return "direccion";
  if (
    member.roleType.startsWith("JEFE_COC") ||
    member.roleType.startsWith("PAR_") ||
    member.roleType.startsWith("FUE_") ||
    member.roleType.startsWith("GUAR_") ||
    member.roleType.startsWith("FREI_") ||
    member.roleType.startsWith("BACH_")
  ) {
    return "cocina";
  }
  return "salon";
}

export function computeRosterAreaBreakdown(
  team: StaffMember[],
  monthlyRevenue: number,
  entries: PayrollEntry[] = DEFAULT_PAYROLL_ENTRIES,
): RosterAreaBreakdownRow[] {
  const totals = (Object.keys(ROSTER_AREA_LABELS) as RosterAreaKey[]).reduce(
    (acc, area) => {
      acc[area] = { people: 0, monthlyCost: 0 };
      return acc;
    },
    {} as Record<RosterAreaKey, { people: number; monthlyCost: number }>,
  );

  for (const member of team) {
    const area = getRosterAreaForMember(member);
    const cost = computeMemberPayrollCost(member, entries);
    totals[area].people += 1;
    totals[area].monthlyCost += cost.totalCost;
  }

  const grandTotal = Object.values(totals).reduce((sum, row) => sum + row.monthlyCost, 0);

  return (Object.keys(ROSTER_AREA_LABELS) as RosterAreaKey[]).map((area) => ({
    area,
    label: ROSTER_AREA_LABELS[area],
    people: totals[area].people,
    monthlyCost: totals[area].monthlyCost,
    payrollPercent: grandTotal > 0 ? (totals[area].monthlyCost / grandTotal) * 100 : 0,
    revenuePercent: monthlyRevenue > 0 ? (totals[area].monthlyCost / monthlyRevenue) * 100 : 0,
  }));
}

export function managerTeamToPayrollCounts(
  team: StaffMember[],
): Partial<Record<PayrollRoleId, number>> {
  const counts: Partial<Record<PayrollRoleId, number>> = {};

  const add = (roleId: PayrollRoleId, amount = 1) => {
    counts[roleId] = (counts[roleId] ?? 0) + amount;
  };

  for (const member of team) {
    const roleId = getPayrollRoleForStaffMember(member);
    if (roleId) add(roleId);
  }

  return counts;
}

export function buildPayrollComparisonRows(
  entries: PayrollEntry[],
  contractedCounts: Partial<Record<PayrollRoleId, number>>,
  suggestedCounts: Partial<Record<PayrollRoleId, number>>,
): PayrollComparisonRow[] {
  const equipoEntries = entries.filter(
    (entry) => entry.roleId !== "DIR_OP" && entry.roleId !== "CHEF_EJ",
  );

  return equipoEntries
    .map((entry) => {
      const contracted = contractedCounts[entry.roleId] ?? 0;
      const suggested = suggestedCounts[entry.roleId] ?? 0;
      const difference = contracted - suggested;
      const grossSalary = computeEntryGross(entry);
      return {
        roleId: entry.roleId,
        label: entry.label,
        contracted,
        suggested,
        difference,
        impact: difference * grossSalary,
        grossSalary,
      };
    })
    .filter((row) => row.difference !== 0);
}

export function cloneDefaultPayrollEntries(): PayrollEntry[] {
  return DEFAULT_PAYROLL_ENTRIES.map((entry) => ({
    ...entry,
    position: getPositionForPayrollRole(entry.roleId),
    label: getPositionLabel(getPositionForPayrollRole(entry.roleId)),
    ccssRate: entry.hasCCSS ? 0.34 : 0,
  }));
}
