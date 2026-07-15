import type { PayrollRoleId } from "@/lib/payroll/types";
import type { StaffRoleType } from "@/lib/staffing/types";

export const STAFF_POSITION_OPTIONS = [
  { id: "socio_operativo", label: "Socio operativo" },
  { id: "chef_ejecutivo", label: "Chef ejecutivo" },
  { id: "gerente", label: "Gerente" },
  { id: "administracion", label: "Administración" },
  { id: "encargado", label: "Encargado" },
  { id: "cajero", label: "Cajero" },
  { id: "jefe_salon", label: "Jefe de salón" },
  { id: "recepcionista", label: "Recepcionista" },
  { id: "camarero", label: "Camarero" },
  { id: "commis", label: "Commis" },
  { id: "eventual", label: "Eventual" },
  { id: "barra_cafe", label: "Barra / Café" },
  { id: "jefe_cocina", label: "Jefe de cocina" },
  { id: "cocinero", label: "Cocinero" },
  { id: "ayudante_cocina", label: "Ayudante de cocina" },
  { id: "bachero", label: "Bachero" },
  { id: "produccion", label: "Jefe de pastelería" },
  { id: "ayudante_produccion", label: "Ayudante de pastelería" },
] as const;

export type StaffPosition = (typeof STAFF_POSITION_OPTIONS)[number]["id"];

export type StaffEmploymentType = "independiente" | "dependiente";

export const EMPLOYMENT_TYPE_OPTIONS: Array<{ id: StaffEmploymentType; label: string }> = [
  { id: "independiente", label: "Independiente" },
  { id: "dependiente", label: "Dependiente" },
];

const POSITION_LABELS = Object.fromEntries(
  STAFF_POSITION_OPTIONS.map((option) => [option.id, option.label]),
) as Record<StaffPosition, string>;

const PAYROLL_ROLE_TO_POSITION: Record<PayrollRoleId, StaffPosition> = {
  DIR_OP: "socio_operativo",
  CHEF_EJ: "chef_ejecutivo",
  ADMIN: "administracion",
  GERENTE: "gerente",
  ENC_TURNO: "encargado",
  CAJERO: "cajero",
  JEFE_SALON: "jefe_salon",
  RECEPCIONISTA: "recepcionista",
  CAMARERO_AM: "camarero",
  CAMARERO_PM: "camarero",
  RUNNER_COMIS: "commis",
  EVENTUAL: "eventual",
  BARRA_BARISTA: "barra_cafe",
  JEFE_COCINA: "jefe_cocina",
  PROD_AM: "produccion",
  AYUDANTE_COC_AM: "ayudante_cocina",
  AYUDANTE_COC_PM: "ayudante_cocina",
  BACHA: "bachero",
};

const STAFF_ROLE_TO_POSITION: Partial<Record<StaffRoleType, StaffPosition>> = {
  LIS: "socio_operativo",
  BRUNO: "chef_ejecutivo",
  GER: "gerente",
  ADMIN: "administracion",
  ENC: "encargado",
  CAJ_AM: "cajero",
  CAJ_PM: "cajero",
  JFS_AM: "jefe_salon",
  JFS_PM: "jefe_salon",
  REC_AM: "recepcionista",
  REC_PM: "recepcionista",
  CAM: "camarero",
  CE: "eventual",
  BC: "barra_cafe",
  CR: "commis",
  JEFE_COC_AM: "jefe_cocina",
  JEFE_COC_PM: "jefe_cocina",
  PAR_AM: "produccion",
  PAR_PM: "ayudante_produccion",
  FUE_AM: "cocinero",
  FUE_PM: "cocinero",
  GUAR_AM: "ayudante_cocina",
  GUAR_PM: "ayudante_cocina",
  FREI_AM: "ayudante_cocina",
  FREI_PM: "ayudante_cocina",
  BACH_AM: "bachero",
  BACH_PM: "bachero",
};

const PAYROLL_ROLE_SHIFT: Partial<Record<PayrollRoleId, "AM" | "PM">> = {
  CAMARERO_AM: "AM",
  CAMARERO_PM: "PM",
  PROD_AM: "AM",
  AYUDANTE_COC_AM: "AM",
  AYUDANTE_COC_PM: "PM",
};

const POSITIONS_WITHOUT_SHIFT = new Set<StaffPosition>([
  "socio_operativo",
  "chef_ejecutivo",
  "gerente",
  "administracion",
  "encargado",
  "commis",
  "eventual",
  "produccion",
]);

export function getPositionLabel(position: StaffPosition): string {
  return POSITION_LABELS[position];
}

export function getPositionForPayrollRole(roleId: PayrollRoleId): StaffPosition {
  return PAYROLL_ROLE_TO_POSITION[roleId];
}

export function getPositionForStaffRole(roleType: StaffRoleType): StaffPosition {
  return STAFF_ROLE_TO_POSITION[roleType] ?? "encargado";
}

export function getPayrollShiftLabel(roleId: PayrollRoleId): "AM" | "PM" | "—" {
  return PAYROLL_ROLE_SHIFT[roleId] ?? "—";
}

export function getStaffRoleForPosition(
  position: StaffPosition,
  shift: "am" | "pm",
): StaffRoleType {
  switch (position) {
    case "socio_operativo":
      return "LIS";
    case "chef_ejecutivo":
      return "BRUNO";
    case "gerente":
      return "GER";
    case "administracion":
      return "ADMIN";
    case "encargado":
      return "ENC";
    case "cajero":
      return shift === "am" ? "CAJ_AM" : "CAJ_PM";
    case "jefe_salon":
      return shift === "am" ? "JFS_AM" : "JFS_PM";
    case "recepcionista":
      return shift === "am" ? "REC_AM" : "REC_PM";
    case "camarero":
      return "CAM";
    case "commis":
      return "CR";
    case "eventual":
      return "CE";
    case "barra_cafe":
      return "BC";
    case "jefe_cocina":
      return shift === "am" ? "JEFE_COC_AM" : "JEFE_COC_PM";
    case "cocinero":
      return shift === "am" ? "FUE_AM" : "FUE_PM";
    case "ayudante_cocina":
      return shift === "am" ? "FUE_AM" : "FUE_PM";
    case "bachero":
      return shift === "am" ? "BACH_AM" : "BACH_PM";
    case "produccion":
      return "PAR_AM";
    case "ayudante_produccion":
      return shift === "am" ? "GUAR_AM" : "PAR_PM";
  }
}

/** Camarero y barra usan el índice par/impar para alternar turno AM/PM. */
export function positionUsesIndexShiftParity(position: StaffPosition): boolean {
  return position === "camarero" || position === "barra_cafe";
}

export function positionNeedsShift(position: StaffPosition): boolean {
  return !POSITIONS_WITHOUT_SHIFT.has(position);
}

export function resolveEmploymentType(entry: {
  dependency: "fijo" | "demanda";
}): StaffEmploymentType {
  return entry.dependency === "fijo" ? "independiente" : "dependiente";
}

export function employmentTypeToDependency(type: StaffEmploymentType): "fijo" | "demanda" {
  return type === "independiente" ? "fijo" : "demanda";
}
