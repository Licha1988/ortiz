import { computeEntryCcss, computeEntryGross, resolveCcssPercent } from "@/lib/payroll/ccss";
import type { PayrollDependency, PayrollEntry, PayrollRoleId } from "@/lib/payroll/types";
import {
  STAFF_POSITION_OPTIONS,
  employmentTypeToDependency,
  getPositionForPayrollRole,
  getPositionLabel,
  resolveEmploymentType,
  type StaffEmploymentType,
  type StaffPosition,
} from "@/lib/staffing/positions";

export type PositionPayrollProfile = {
  position: StaffPosition;
  label: string;
  netSalary: number;
  ccssRate: number;
  hasCCSS: boolean;
  dependency: PayrollDependency;
  employmentType: StaffEmploymentType;
  ccss: number;
  grossSalary: number;
};

/** Rol de nómina usado para leer el perfil inicial de cada puesto. */
const POSITION_PRIMARY_ROLE: Record<StaffPosition, PayrollRoleId | null> = {
  socio_operativo: "DIR_OP",
  chef_ejecutivo: "CHEF_EJ",
  gerente: "GERENTE",
  administracion: "ADMIN",
  encargado: "ENC_TURNO",
  cajero: "CAJERO",
  jefe_salon: "JEFE_SALON",
  recepcionista: "RECEPCIONISTA",
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

/** Roles de nómina que reciben el mismo sueldo/CCSS/dependencia al editar un puesto. */
const POSITION_SYNC_ROLES: Record<StaffPosition, PayrollRoleId[]> = {
  socio_operativo: ["DIR_OP"],
  chef_ejecutivo: ["CHEF_EJ"],
  gerente: ["GERENTE"],
  administracion: ["ADMIN"],
  encargado: ["ENC_TURNO"],
  cajero: ["CAJERO"],
  jefe_salon: ["JEFE_SALON"],
  recepcionista: ["RECEPCIONISTA"],
  camarero: ["CAMARERO_AM", "CAMARERO_PM"],
  commis: ["RUNNER_COMIS"],
  eventual: ["EVENTUAL"],
  barra_cafe: ["BARRA_BARISTA"],
  jefe_cocina: ["JEFE_COCINA"],
  cocinero: ["AYUDANTE_COC_AM"],
  ayudante_cocina: ["AYUDANTE_COC_PM"],
  bachero: ["BACHA"],
  produccion: ["PROD_AM"],
  ayudante_produccion: ["AYUDANTE_COC_PM"],
};

function findEntry(entries: PayrollEntry[], roleId: PayrollRoleId | null): PayrollEntry | undefined {
  if (!roleId) return undefined;
  return entries.find((entry) => entry.roleId === roleId);
}

function buildProfileFromEntry(
  position: StaffPosition,
  entry: PayrollEntry,
): PositionPayrollProfile {
  return {
    position,
    label: getPositionLabel(position),
    netSalary: entry.netSalary,
    ccssRate: entry.ccssRate ?? (entry.hasCCSS ? 0.34 : 0),
    hasCCSS: entry.hasCCSS,
    dependency: entry.dependency,
    employmentType: resolveEmploymentType(entry),
    ccss: computeEntryCcss(entry),
    grossSalary: computeEntryGross(entry),
  };
}

export function getPositionProfile(
  entries: PayrollEntry[],
  position: StaffPosition,
): PositionPayrollProfile {
  const primary = findEntry(entries, POSITION_PRIMARY_ROLE[position]);
  if (primary) {
    return buildProfileFromEntry(position, {
      ...primary,
      position,
    });
  }

  const fallback = entries.find(
    (entry) => getPositionForPayrollRole(entry.roleId) === position,
  );
  if (fallback) {
    return buildProfileFromEntry(position, { ...fallback, position });
  }

  return {
    position,
    label: getPositionLabel(position),
    netSalary: 0,
    ccssRate: 0.34,
    hasCCSS: true,
    dependency: "demanda",
    employmentType: "dependiente",
    ccss: 0,
    grossSalary: 0,
  };
}

export function listPositionProfiles(entries: PayrollEntry[]): PositionPayrollProfile[] {
  return STAFF_POSITION_OPTIONS.map((option) => getPositionProfile(entries, option.id));
}

export function applyPositionPatch(
  entries: PayrollEntry[],
  position: StaffPosition,
  patch: Partial<Pick<PayrollEntry, "netSalary" | "ccssRate" | "hasCCSS" | "dependency" | "position">>,
): PayrollEntry[] {
  const roleIds = new Set(POSITION_SYNC_ROLES[position]);
  const label = getPositionLabel(position);

  return entries.map((entry) => {
    if (!roleIds.has(entry.roleId)) return entry;
    const next = {
      ...entry,
      ...patch,
      position,
      label,
    };
    return next;
  });
}

export function setPositionNetSalary(
  entries: PayrollEntry[],
  position: StaffPosition,
  netSalary: number,
): PayrollEntry[] {
  return applyPositionPatch(entries, position, { netSalary, position });
}

export function setPositionCcssRate(
  entries: PayrollEntry[],
  position: StaffPosition,
  ccssRate: number,
): PayrollEntry[] {
  return applyPositionPatch(entries, position, {
    ccssRate,
    hasCCSS: ccssRate > 0,
    position,
  });
}

export function setPositionEmploymentType(
  entries: PayrollEntry[],
  position: StaffPosition,
  employmentType: StaffEmploymentType,
): PayrollEntry[] {
  return applyPositionPatch(entries, position, {
    dependency: employmentTypeToDependency(employmentType),
    position,
  });
}

export function resolveCcssPercentForPosition(
  entries: PayrollEntry[],
  position: StaffPosition,
): number {
  return resolveCcssPercent(getPositionProfile(entries, position));
}
