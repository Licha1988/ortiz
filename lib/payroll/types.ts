import type { StaffPosition } from "@/lib/staffing/positions";

export type PayrollCategory = "direccion" | "foh" | "boh";
export type PayrollDependency = "fijo" | "demanda";

export type PayrollRoleId =
  | "DIR_OP"
  | "CHEF_EJ"
  | "ADMIN"
  | "GERENTE"
  | "ENC_TURNO"
  | "CAJERO"
  | "JEFE_SALON"
  | "CAMARERO_AM"
  | "CAMARERO_PM"
  | "RUNNER_COMIS"
  | "EVENTUAL"
  | "BARRA_BARISTA"
  | "JEFE_COCINA"
  | "PROD_AM"
  | "AYUDANTE_COC_AM"
  | "AYUDANTE_COC_PM"
  | "BACHA";

export type PayrollEntry = {
  roleId: PayrollRoleId;
  label: string;
  position?: StaffPosition;
  category: PayrollCategory;
  dependency: PayrollDependency;
  isEssential: boolean;
  hasCCSS: boolean;
  /** Tasa CCSS por puesto (0–1). Default: 34% si hasCCSS, 0 si no. */
  ccssRate?: number;
  isManagement?: boolean; // true = Lisandro o Bruno → sección separada
  quantity: number;
  netSalary: number;
  kitchenCoversThreshold?: number;
  kitchenCoversPerPerson?: number;
  elasticity: "alta" | "media" | "baja" | "ninguna";
  notes?: string;
};

export type RefuerzoEntry = {
  label: string;
  valor4hs: number;
};

export type PayrollState = {
  entries: PayrollEntry[];
  refuerzos: RefuerzoEntry[];
};

export type PayrollRowComputed = PayrollEntry & {
  ccss: number;
  grossSalary: number;
  rowTotal: number;
};

export type PayrollSummary = {
  // Costo total (incluye gestión)
  totalPayroll: number;
  totalNet: number;
  totalCCSS: number;
  // Desglose por categoría
  fohSubtotal: number;
  bohSubtotal: number;
  direccionSubtotal: number;
  // Separación gestión operativa (Lisandro + Bruno) vs equipo
  managementSubtotal: number;
  /** Nómina mensual del equipo fijo (sin gestión ni eventuales de plantilla). */
  nominaOperativaSubtotal: number;
  /** Contratación diaria de eventuales del mes. */
  eventualesSubtotal: number;
  /** Nómina operativa + eventuales diarios. */
  equipoSubtotal: number;
  managementToRevenuePercent: number;
  nominaOperativaToRevenuePercent: number;
  eventualesToRevenuePercent: number;
  equipoToRevenuePercent: number;
  // Indicadores
  payrollToRevenuePercent: number;
  rows: PayrollRowComputed[];
  contractedHeadcount: number;
};
