import type { StaffRoleType } from "./types";

export const STAFF_ROLE_ORDER: StaffRoleType[] = [
  // Fijos independientes de turno
  "LIS", "BRUNO", "GER", "ADMIN",
  // Turno AM
  "ENC", "CAJ_AM", "JFS_AM", "CAM", "CE", "BC", "CR",
  "PAR_AM", "JEFE_COC_AM", "FUE_AM",
  // Turno PM
  "CAJ_PM", "JFS_PM", "REC_PM", "JEFE_COC_PM",
  "PAR_PM", "FUE_PM", "GUAR_PM", "FREI_PM", "BACH_PM",
];

export const FIXED_STAFF_ROLES: StaffRoleType[] = [
  "LIS", "BRUNO", "GER", "ADMIN", "ENC", "PAR_AM", "JEFE_COC_AM",
];

export const DEMAND_STAFF_ROLES: StaffRoleType[] = [
  "CAJ_AM", "JFS_AM", "CAM", "CE", "BC",
  "FUE_AM", "CAJ_PM", "JFS_PM", "REC_PM", "JEFE_COC_PM",
  "PAR_PM", "FUE_PM", "GUAR_PM", "FREI_PM", "BACH_PM",
  "CR",
];

type RoleConfig = {
  label: string;
  shiftCode: string;
  groupLabel: string;
  dependency: "independiente" | "dependiente";
  maturityReason: string;
  maturityTrigger: string;
  group: "foh" | "boh";
};

export const ROLE_CONFIG: Record<StaffRoleType, RoleConfig> = {
  // ── FOH ──────────────────────────────────────────────────────────────────
  GER: {
    label: "Gerente",
    shiftCode: "G",
    groupLabel: "Gerente (GER)",
    dependency: "independiente",
    maturityReason: "Rol estratégico: existe desde la apertura",
    maturityTrigger: "No depende de capacidad",
    group: "foh",
  },
  ADMIN: {
    label: "Administración",
    shiftCode: "A",
    groupLabel: "Administración (ADMIN)",
    dependency: "independiente",
    maturityReason: "Back office y administración del local",
    maturityTrigger: "No depende de capacidad",
    group: "foh",
  },
  ENC: {
    label: "Encargado AM",
    shiftCode: "E",
    groupLabel: "Encargado AM (ENC)",
    dependency: "independiente",
    maturityReason: "Rol operativo base: existe desde la apertura",
    maturityTrigger: "No depende de capacidad",
    group: "foh",
  },
  CAJ_AM: {
    label: "Cajero AM",
    shiftCode: "CA",
    groupLabel: "Cajero AM (CAJ)",
    dependency: "dependiente",
    maturityReason: "La demanda matutina requiere caja dedicada",
    maturityTrigger: "Depende de cubiertos AM",
    group: "foh",
  },
  CAJ_PM: {
    label: "Cajero PM",
    shiftCode: "CP",
    groupLabel: "Cajero PM (CAJ)",
    dependency: "dependiente",
    maturityReason: "La demanda vespertina requiere caja dedicada",
    maturityTrigger: "Escala con cubiertos PM",
    group: "foh",
  },
  JFS_AM: {
    label: "Jefe de Salón AM",
    shiftCode: "JA",
    groupLabel: "Jefe de Salón AM (JFS)",
    dependency: "dependiente",
    maturityReason: "La demanda matutina supera la capacidad combinada",
    maturityTrigger: "Depende de cubiertos AM",
    group: "foh",
  },
  JFS_PM: {
    label: "Jefe de Salón PM",
    shiftCode: "JP",
    groupLabel: "Jefe de Salón PM (JFS)",
    dependency: "dependiente",
    maturityReason: "La demanda vespertina supera la capacidad combinada",
    maturityTrigger: "Depende de cubiertos PM",
    group: "foh",
  },
  REC_PM: {
    label: "Recepcionista PM",
    shiftCode: "RE",
    groupLabel: "Recepcionista PM (REC)",
    dependency: "dependiente",
    maturityReason: "La demanda vespertina requiere recepción dedicada",
    maturityTrigger: "Depende de cubiertos del día",
    group: "foh",
  },
  CAM: {
    label: "Camarero",
    shiftCode: "C",
    groupLabel: "Camareros (CAM)",
    dependency: "independiente",
    maturityReason: "Rol de servicio base: existe desde la apertura",
    maturityTrigger: "Escala con cubiertos simultáneos en rush",
    group: "foh",
  },
  CR: {
    label: "Camarero AM",
    shiftCode: "CAM",
    groupLabel: "Camarero AM",
    dependency: "independiente",
    maturityReason: "Camarero fijo AM con una cobertura rotativa semanal",
    maturityTrigger: "Base fija AM; un día cubre turno PM",
    group: "foh",
  },
  CE: {
    label: "Comis / Eventual",
    shiftCode: "CE",
    groupLabel: "Comis / Eventual (CE)",
    dependency: "dependiente",
    maturityReason: "Refuerzo cuando la demanda supera la dotación base",
    maturityTrigger: "Escala con overflow del rush",
    group: "foh",
  },
  BC: {
    label: "Barra / Café",
    shiftCode: "BC",
    groupLabel: "Barra / Café (BC)",
    dependency: "dependiente",
    maturityReason: "Cobertura de barra en turno diurno (9 h) y vespertino (15 h+)",
    maturityTrigger: "Escala con cubiertos pico rush",
    group: "foh",
  },
  // ── BOH fijos ─────────────────────────────────────────────────────────────
  LIS: {
    label: "Lisandro (Dirección operativa)",
    shiftCode: "LIS",
    groupLabel: "Dirección operativa (LIS)",
    dependency: "independiente",
    maturityReason: "Socio operativo: siempre presente",
    maturityTrigger: "No depende de capacidad",
    group: "boh",
  },
  BRUNO: {
    label: "Bruno Bonnano (Chef ejecutivo)",
    shiftCode: "CHF",
    groupLabel: "Chef ejecutivo (BRUNO)",
    dependency: "independiente",
    maturityReason: "Diseña y gestiona la carta: siempre presente",
    maturityTrigger: "No depende de capacidad",
    group: "boh",
  },
  JEFE_COC_AM: {
    label: "Jefe de cocina AM",
    shiftCode: "JCA",
    groupLabel: "Jefe cocina AM",
    dependency: "independiente",
    maturityReason: "Liderazgo fijo de cocina AM: siempre presente",
    maturityTrigger: "No depende de capacidad",
    group: "boh",
  },
  JEFE_COC_PM: {
    label: "Jefe de cocina PM",
    shiftCode: "JCP",
    groupLabel: "Jefe cocina PM",
    dependency: "dependiente",
    maturityReason: "Servicio de cena requiere liderazgo de cocina propio",
    maturityTrigger: "Activo cuando hay cubiertos PM",
    group: "boh",
  },
  // ── BOH AM ────────────────────────────────────────────────────────────────
  PAR_AM: {
    label: "Jefe de pastelería AM",
    shiftCode: "PROD",
    groupLabel: "Jefe de pastelería AM",
    dependency: "independiente",
    maturityReason: "Pastelería y preparación AM: rol fijo de apertura",
    maturityTrigger: "No depende de capacidad",
    group: "boh",
  },
  FUE_AM: {
    label: "Cocinero AM",
    shiftCode: "COC",
    groupLabel: "Cocinero AM",
    dependency: "dependiente",
    maturityReason: "Cocina AM polivalente, sin estación fija",
    maturityTrigger: "Escala con cubiertos AM",
    group: "boh",
  },
  GUAR_AM: {
    label: "Cocinero AM",
    shiftCode: "AC",
    groupLabel: "Cocinero AM",
    dependency: "dependiente",
    maturityReason: "Cocina AM polivalente, sin estación fija",
    maturityTrigger: "Escala con cubiertos AM",
    group: "boh",
  },
  FREI_AM: {
    label: "Cocinero AM",
    shiftCode: "AC",
    groupLabel: "Cocinero AM",
    dependency: "dependiente",
    maturityReason: "Cocina AM polivalente, sin estación fija",
    maturityTrigger: "Escala con cubiertos AM",
    group: "boh",
  },
  BACH_AM: {
    label: "Cocinero AM",
    shiftCode: "AC",
    groupLabel: "Cocinero AM",
    dependency: "dependiente",
    maturityReason: "Cocina AM polivalente, sin estación fija",
    maturityTrigger: "Escala con cubiertos AM",
    group: "boh",
  },
  // ── BOH PM ────────────────────────────────────────────────────────────────
  PAR_PM: {
    label: "Ayudante de pastelería PM",
    shiftCode: "PAR",
    groupLabel: "Ayudante de pastelería PM",
    dependency: "dependiente",
    maturityReason: "Estación de pastelería para servicio PM",
    maturityTrigger: "Escala con cubiertos PM",
    group: "boh",
  },
  FUE_PM: {
    label: "Ayudante cocina PM — Fuegos",
    shiftCode: "FUE",
    groupLabel: "Ayudante cocina PM — Fuegos",
    dependency: "dependiente",
    maturityReason: "Estación de fuegos para servicio PM",
    maturityTrigger: "Escala con cubiertos PM",
    group: "boh",
  },
  GUAR_PM: {
    label: "Ayudante cocina PM — Guarniciones",
    shiftCode: "GUA",
    groupLabel: "Ayudante cocina PM — Guarniciones",
    dependency: "dependiente",
    maturityReason: "Estación de guarniciones para servicio PM",
    maturityTrigger: "Escala con cubiertos PM",
    group: "boh",
  },
  FREI_PM: {
    label: "Ayudante cocina PM — Freidora",
    shiftCode: "FRE",
    groupLabel: "Ayudante cocina PM — Freidora",
    dependency: "dependiente",
    maturityReason: "Estación de freidora para servicio PM",
    maturityTrigger: "Escala con cubiertos PM",
    group: "boh",
  },
  BACH_PM: {
    label: "Bacha PM",
    shiftCode: "BP",
    groupLabel: "Bacha PM",
    dependency: "dependiente",
    maturityReason: "Escala con el volumen de servicio vespertino/cena",
    maturityTrigger: "Ratio cubiertos PM / bacha",
    group: "boh",
  },
};
