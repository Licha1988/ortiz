export type StaffingParams = {
  // ── Rush windows (hora del día) + permanencia ─────────────────────────────
  rushDesayunoStart: number;
  rushDesayunoEnd:   number;
  rushDesayunoShare: number; // % de la franja que cae dentro del rush
  dwellDesayuno:     number; // horas de permanencia promedio
  rushAlmuerzoStart: number;
  rushAlmuerzoEnd:   number;
  rushAlmuerzoShare: number;
  dwellAlmuerzo:     number;
  rushMeriendaStart: number;
  rushMeriendaEnd:   number;
  rushMeriendaShare: number;
  dwellMerienda:     number;
  rushCenaStart:     number;
  rushCenaEnd:       number;
  rushCenaShare:     number;
  dwellCena:         number;
  // ── FOH ──────────────────────────────────────────────────────────────────
  waiterRatioDay:    number; // cubiertos simultáneos por camarero — AM
  waiterRatioDinner: number; // cubiertos simultáneos por camarero — PM/cena
  contractHoursPerDay: number;
  minHoursPerShift: number;
  maxHoursPerShift: number;
  minHoursEventual: number;
  maxHoursEventual: number;
  weeklyDayOff: number;
  shiftOverlap: number;
  eventualThresholdPercent: number;
  commisRatioDay: number;
  commisRatioDinner: number;
  barRatio: number;
  barPmRatio: number;
  barEventualRatio: number;
  cajeroAmRatio: number;
  cajeroPmRatio: number;
  recepcionistaPmRatio: number;
  jefeSalonAmRatio: number;
  jefeSalonPmRatio: number;
  // BOH kitchen — jefes
  jefeCocinaAmThreshold: number;
  jefeCocinaPmThreshold: number;
  // BOH kitchen — AM
  parrillaAmThreshold: number; // legacy: producción AM es fija
  ayudanteAmRatio:     number; // cubiertos pico rush AM por cocinero AM
  bachaAmRatio:        number; // legacy: bacha AM ya no se muestra
  // BOH kitchen — PM
  ayudantePmRatio:     number; // cubiertos pico rush PM por ayudante de despacho
  bachaPmRatio:        number;
};

export type StaffingParamKey = keyof StaffingParams;

// Discriminated union: editable input row vs. fixed/informational row
export type StaffingParamMeta =
  | {
      type: "input";
      key: StaffingParamKey;
      label: string;
      unit: string;
      description: string;
      step: number;
      min: number;
      section?: string;
    }
  | {
      type: "fixed";
      key?: never;
      label: string;
      unit?: string;
      description: string;
      section?: string;
      badge?: string; // overrides the default "Fijo" badge text
    };

export const DEFAULT_STAFFING_PARAMS: StaffingParams = {
  // Rush windows + permanencia
  rushDesayunoStart: 9,  rushDesayunoEnd: 11, rushDesayunoShare: 60, dwellDesayuno: 0.75,
  rushAlmuerzoStart: 13, rushAlmuerzoEnd: 15, rushAlmuerzoShare: 70, dwellAlmuerzo: 1.25,
  rushMeriendaStart: 17, rushMeriendaEnd: 19, rushMeriendaShare: 60, dwellMerienda: 0.75,
  rushCenaStart:     20, rushCenaEnd:     22, rushCenaShare:     75, dwellCena:     2.0,
  // FOH
  waiterRatioDay:    30,
  waiterRatioDinner: 25,
  contractHoursPerDay: 8,
  minHoursPerShift: 6,
  maxHoursPerShift: 9,
  minHoursEventual: 4,
  maxHoursEventual: 8,
  weeklyDayOff: 1,
  shiftOverlap: 0.5,
  eventualThresholdPercent: 20,
  commisRatioDay: 30,
  commisRatioDinner: 25,
  barRatio: 120,         // 1 barista AM cada 120 cub diurnos (desayuno+almuerzo)
  barPmRatio: 100,       // 1 barista PM cada 100 cub vespertinos (merienda+cena)
  barEventualRatio: 80,
  cajeroAmRatio: 120,    // 1 cajero AM por cada 120 cub pico mañana
  cajeroPmRatio: 200,
  recepcionistaPmRatio: 250,
  jefeSalonAmRatio: 150,
  jefeSalonPmRatio: 120,
  jefeCocinaAmThreshold: 50,
  jefeCocinaPmThreshold: 50,
  parrillaAmThreshold: 0,
  ayudanteAmRatio:     100,  // 1 cocinero AM por cada 100 cub pico rush AM
  bachaAmRatio:        300,
  ayudantePmRatio:     80,   // 1 ayudante por cada 80 cub pico rush PM (cena más concentrada)
  bachaPmRatio:        400,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tabla de parámetros reorganizada:
//   1. Puestos por turno: Salón AM → Salón PM → Cocina AM → Cocina PM
//   2. Criterios generales (franco, solapamiento, horas, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export const STAFFING_PARAM_ROWS: StaffingParamMeta[] = [

  // ── Salón AM (9:00 – 17:00) ───────────────────────────────────────────────
  { type: "fixed",  section: "Salón AM (9:00 – 17:00)", label: "Gerente",        description: "Rol estratégico fijo — activo desde la apertura" },
  { type: "fixed",  label: "Encargado AM",               description: "Rol operativo fijo — apertura y gestión matutina" },
  { type: "input",  key: "cajeroAmRatio",       label: "Cajero AM",          unit: "cub pico rush / cajero",   description: "Cubiertos en hora pico (rush) AM para activar cajero diurno",                                           step: 5,   min: 1 },
  { type: "input",  key: "jefeSalonAmRatio",    label: "Jefe de salón AM",   unit: "cub pico rush / jefe",     description: "Cubiertos en hora pico (rush) AM para activar jefe de salón",                                          step: 5,   min: 1 },
  { type: "input",  key: "waiterRatioDay",      label: "Camarero AM",        unit: "cub simultáneos / cam",    description: "Cubiertos simultáneos en el pico (rush) que atiende un camarero AM — determina el tamaño del equipo",   step: 1,   min: 1 },
  { type: "input",  key: "commisRatioDay",      label: "Commis / Eventual AM", unit: "cub pico rush / commis", description: "Cubiertos en hora pico (rush) AM para activar un commis de refuerzo",                                  step: 1,   min: 1 },
  { type: "input",  key: "barRatio",            label: "Barra / Café AM",    unit: "cub pico rush / barista",  description: "Cubiertos en hora pico (rush) AM por barista diurno (9–17 h)",                                         step: 5,   min: 1 },

  // ── Salón PM (17:00 – Cierre) ─────────────────────────────────────────────
  { type: "input",  section: "Salón PM (17:00 – Cierre)", key: "cajeroPmRatio", label: "Cajero PM",      unit: "cub pico rush / cajero",   description: "Cubiertos en hora pico (rush) PM para activar cajero vespertino",                                      step: 5,   min: 1 },
  { type: "input",  key: "barPmRatio",          label: "Barra / Café PM",    unit: "cub pico rush / barista",  description: "Cubiertos en hora pico (rush) PM por barista vespertino (17 h–cierre)",                                step: 5,   min: 1 },
  { type: "input",  key: "jefeSalonPmRatio",    label: "Jefe de salón PM",   unit: "cub pico rush / jefe",     description: "Cubiertos en hora pico (rush) PM para activar jefe de salón",                                          step: 5,   min: 1 },
  { type: "input",  key: "recepcionistaPmRatio", label: "Recepcionista PM",  unit: "cub pico rush / recep.",   description: "Cubiertos en hora pico (rush) PM para activar recepcionista vespertino",                                step: 10,  min: 1 },
  { type: "input",  key: "waiterRatioDinner",   label: "Camarero PM",        unit: "cub simultáneos / cam",    description: "Cubiertos simultáneos en el pico (rush) que atiende un camarero PM/cena — la cena es más exigente",    step: 1,   min: 1 },
  { type: "input",  key: "commisRatioDinner",   label: "Commis / Eventual PM", unit: "cub pico rush / commis", description: "Cubiertos en hora pico (rush) PM para activar un commis de refuerzo en cena",                          step: 1,   min: 1 },
  { type: "input",  key: "barEventualRatio",    label: "Refuerzo barra",     unit: "cub pico rush / barista",  description: "Cubiertos en pico extremo (rush) para activar barista de refuerzo (AM o PM)",                          step: 5,   min: 1 },

  // ── Cocina AM (9:00 – 17:00) ──────────────────────────────────────────────
  { type: "fixed",  section: "Cocina AM (9:00 – 17:00)", label: "Responsable de producción AM", unit: "—", description: "Rol fijo de apertura y producción AM — independiente de capacidad" },
  { type: "fixed",  label: "Jefe de cocina AM", unit: "—", description: "Rol fijo de liderazgo AM — independiente de capacidad" },
  { type: "input",  key: "ayudanteAmRatio", label: "Cocinero AM", unit: "cub pico rush / cocinero", description: "Escala con cubiertos AM: 1 cocinero cada este ratio de cubiertos en hora pico (rush)", step: 5, min: 5 },

  // ── Cocina PM (17:00 – Cierre) ────────────────────────────────────────────
  { type: "input",  section: "Cocina PM (17:00 – Cierre)", key: "jefeCocinaPmThreshold", label: "Jefe de cocina PM",     unit: "cub pico rush PM",  description: "Cubiertos en hora pico (rush) PM para activar jefe de cocina vespertino",                              step: 5,  min: 0 },
  { type: "input",  key: "ayudantePmRatio",               label: "Ayudantes cocina PM por estación", unit: "cub pico rush / estación", description: "Escala con cubiertos PM: activa Parrilla, Fuegos, Guarniciones y Freidora según demanda del rush", step: 5,  min: 5 },
  { type: "input",  key: "bachaPmRatio",                  label: "Bacha PM",              unit: "cub pico rush / bacha", description: "Cubiertos en hora pico (rush) PM por persona de bacha",                                             step: 5,  min: 10 },

  // ── Criterios generales ───────────────────────────────────────────────────
  { type: "input",  section: "Criterios generales", key: "contractHoursPerDay",    label: "Horas contrato por día",         unit: "horas/persona",    description: "Jornada base contractual; el banco de horas permite flexibilizar",             step: 0.5, min: 1 },
  { type: "input",  key: "minHoursPerShift",        label: "Mínimo horas por jornada",       unit: "horas",            description: "Un día puede reducirse a este mínimo compensando en otro",                    step: 0.5, min: 1 },
  { type: "input",  key: "maxHoursPerShift",        label: "Máximo horas por jornada",       unit: "horas",            description: "Un día de alta demanda puede extenderse hasta este máximo",                   step: 0.5, min: 1 },
  { type: "input",  key: "minHoursEventual",        label: "Mínimo horas eventual / commis", unit: "horas",            description: "Piso de horas para refuerzos y eventuales",                                   step: 0.5, min: 1 },
  { type: "input",  key: "maxHoursEventual",        label: "Máximo horas eventual / commis", unit: "horas",            description: "Tope de horas para refuerzos y eventuales",                                   step: 0.5, min: 1 },
  { type: "input",  key: "weeklyDayOff",            label: "Franco semanal",                 unit: "día/persona",      description: "Cada persona descansa 1 día — la plantilla se dimensiona × 7/6",              step: 1,   min: 0 },
  { type: "input",  key: "shiftOverlap",            label: "Solapamiento entre turnos",      unit: "horas",            description: "Tiempo de pase entre turno saliente y entrante",                              step: 0.1, min: 0 },
  { type: "input",  key: "eventualThresholdPercent", label: "Umbral eventual (%)",           unit: "% sobre dotación", description: "Si la demanda pico supera este porcentaje, se activa el commis / eventual",  step: 1,   min: 0 },
];

export const GENERAL_STAFFING_PARAM_ROWS = STAFFING_PARAM_ROWS.filter(
  (row) => row.section === "Criterios generales",
);

export function shiftsPerPersonWeek(params: StaffingParams): number {
  const workingDays = Math.max(1, 7 - params.weeklyDayOff);
  const avgShiftHours = (params.minHoursPerShift + params.maxHoursPerShift) / 2;
  return Math.max(1, Math.round((workingDays * params.contractHoursPerDay) / avgShiftHours));
}
