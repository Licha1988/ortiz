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
  | "BARRA_BARISTA"
  | "JEFE_COCINA"
  | "PROD_AM"
  | "AYUDANTE_COC_AM"
  | "AYUDANTE_COC_PM"
  | "BACHA";

export type PayrollEntry = {
  roleId: PayrollRoleId;
  label: string;
  category: PayrollCategory;
  dependency: PayrollDependency;
  isEssential: boolean;
  hasCCSS: boolean;
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
  suggestedQty: number;
  suggestedRowTotal: number; // suggestedQty × grossSalary
  qtyDelta: number;          // suggestedQty − quantity  (+ = need more, − = over-hired)
  costDelta: number;         // suggestedRowTotal − rowTotal
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
  equipoSubtotal: number;
  managementToRevenuePercent: number;
  equipoToRevenuePercent: number;
  // Indicadores
  payrollToRevenuePercent: number;
  rows: PayrollRowComputed[];
  // Contracted vs suggested comparison
  suggestedPayroll: number;
  suggestedHeadcount: number;
  contractedHeadcount: number;
  payrollGap: number;
  headcountGap: number;
  suggestedToRevenuePercent: number;
};
