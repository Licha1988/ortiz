import { computeRow } from "@/lib/payroll/calculations";
import type { PayrollEntry, PayrollRoleId, PayrollSummary } from "@/lib/payroll/types";
import { getPositionProfile } from "@/lib/staffing/position-payroll";
import {
  STAFF_POSITION_OPTIONS,
  getPositionLabel,
  type StaffPosition,
} from "@/lib/staffing/positions";
import {
  computeMemberPayrollCost,
  resolveMemberPosition,
} from "@/lib/staffing/payroll-bridge";
import type { StaffMember } from "@/lib/staffing/types";
import {
  computeEventualDailySummary,
  type EventualDailyHire,
} from "@/lib/staffing/eventual-daily";

const MANAGEMENT_POSITIONS = new Set<StaffPosition>(["socio_operativo", "chef_ejecutivo"]);

const POSITION_PAYROLL_ROLE: Record<StaffPosition, PayrollRoleId> = {
  socio_operativo: "DIR_OP",
  chef_ejecutivo: "CHEF_EJ",
  gerente: "GERENTE",
  administracion: "ADMIN",
  encargado: "ENC_TURNO",
  cajero: "CAJERO",
  jefe_salon: "JEFE_SALON",
  camarero: "CAMARERO_AM",
  commis: "RUNNER_COMIS",
  eventual: "EVENTUAL",
  barra_cafe: "BARRA_BARISTA",
  jefe_cocina: "JEFE_COCINA",
  cocinero: "AYUDANTE_COC_AM",
  ayudante_cocina: "AYUDANTE_COC_PM",
  bachero: "BACHA",
  produccion: "PROD_AM",
  ayudante_produccion: "AYUDANTE_COC_PM",
};

function isManagementMember(member: StaffMember): boolean {
  return MANAGEMENT_POSITIONS.has(resolveMemberPosition(member));
}

function countTeamByPosition(team: StaffMember[]): Record<StaffPosition, number> {
  return STAFF_POSITION_OPTIONS.reduce(
    (acc, option) => {
      acc[option.id] = team.filter(
        (member) => resolveMemberPosition(member) === option.id,
      ).length;
      return acc;
    },
    {} as Record<StaffPosition, number>,
  );
}

function buildHrPayrollRows(
  team: StaffMember[],
  payrollEntries: PayrollEntry[],
): PayrollSummary["rows"] {
  const contractedByPosition = countTeamByPosition(team);

  return STAFF_POSITION_OPTIONS.map((option) => {
    const profile = getPositionProfile(payrollEntries, option.id);
    const baseEntry = payrollEntries.find(
      (entry) => entry.roleId === POSITION_PAYROLL_ROLE[option.id],
    );
    const quantity = contractedByPosition[option.id];

    const entry: PayrollEntry = {
      roleId: POSITION_PAYROLL_ROLE[option.id],
      label: getPositionLabel(option.id),
      category: baseEntry?.category ?? "foh",
      dependency: profile.dependency,
      quantity,
      netSalary: profile.netSalary,
      hasCCSS: profile.hasCCSS,
      ccssRate: profile.ccssRate,
      position: option.id,
      isEssential: baseEntry?.isEssential ?? false,
      elasticity: baseEntry?.elasticity ?? "ninguna",
    };

    return computeRow(entry);
  }).filter((row) => row.quantity > 0);
}

export function computeHrOperationalSummary(
  team: StaffMember[],
  payrollEntries: PayrollEntry[],
  monthlyRevenue: number,
  eventualDailyHires: EventualDailyHire[] = [],
): PayrollSummary {
  let managementSubtotal = 0;
  let nominaOperativaSubtotal = 0;
  let totalNet = 0;
  let totalCCSS = 0;
  let fohSubtotal = 0;
  let bohSubtotal = 0;
  let direccionSubtotal = 0;

  for (const member of team) {
    const position = resolveMemberPosition(member);
    if (position === "eventual") {
      continue;
    }

    const cost = computeMemberPayrollCost(member, payrollEntries);
    totalNet += cost.netSalary;
    totalCCSS += cost.ccss;

    if (isManagementMember(member)) {
      managementSubtotal += cost.totalCost;
      continue;
    }

    nominaOperativaSubtotal += cost.totalCost;

    if (position === "gerente" || position === "administracion") {
      direccionSubtotal += cost.totalCost;
    } else if (
      position === "jefe_cocina" ||
      position === "cocinero" ||
      position === "ayudante_cocina" ||
      position === "bachero" ||
      position === "produccion" ||
      position === "ayudante_produccion"
    ) {
      bohSubtotal += cost.totalCost;
    } else {
      fohSubtotal += cost.totalCost;
    }
  }

  const eventualSummary = computeEventualDailySummary(eventualDailyHires, payrollEntries);
  const eventualesSubtotal = eventualSummary.totalCost;
  totalNet += eventualSummary.totalNet;
  totalCCSS += eventualSummary.totalCcss;
  fohSubtotal += eventualesSubtotal;

  const equipoSubtotal = nominaOperativaSubtotal + eventualesSubtotal;
  const totalPayroll = managementSubtotal + equipoSubtotal;

  const contractedHeadcount = team.filter((member) => {
    const position = resolveMemberPosition(member);
    return !isManagementMember(member) && position !== "eventual";
  }).length;

  const managementToRevenuePercent =
    monthlyRevenue > 0 ? (managementSubtotal / monthlyRevenue) * 100 : 0;
  const nominaOperativaToRevenuePercent =
    monthlyRevenue > 0 ? (nominaOperativaSubtotal / monthlyRevenue) * 100 : 0;
  const eventualesToRevenuePercent =
    monthlyRevenue > 0 ? (eventualesSubtotal / monthlyRevenue) * 100 : 0;
  const equipoToRevenuePercent =
    monthlyRevenue > 0 ? (equipoSubtotal / monthlyRevenue) * 100 : 0;
  const payrollToRevenuePercent =
    monthlyRevenue > 0 ? (totalPayroll / monthlyRevenue) * 100 : 0;

  const rows = buildHrPayrollRows(team, payrollEntries);

  return {
    totalPayroll,
    totalNet,
    totalCCSS,
    fohSubtotal,
    bohSubtotal,
    direccionSubtotal,
    managementSubtotal,
    nominaOperativaSubtotal,
    eventualesSubtotal,
    equipoSubtotal,
    managementToRevenuePercent,
    nominaOperativaToRevenuePercent,
    eventualesToRevenuePercent,
    equipoToRevenuePercent,
    payrollToRevenuePercent,
    rows,
    contractedHeadcount,
  };
}
