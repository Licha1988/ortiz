import type { Day, DashboardResults } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";
import type { StaffingParams } from "./params";
import { shiftsPerPersonWeek } from "./params";
import {
  DEMAND_STAFF_ROLES,
  FIXED_STAFF_ROLES,
  ROLE_CONFIG,
  STAFF_ROLE_ORDER,
} from "./role-config";
import { createStaffMember, getMemberShiftGroup } from "./schedules";
import type {
  EventualAnalysis,
  MaturityRoleRow,
  RequiredHeadcount,
  StaffAction,
  StaffActionStatus,
  StaffingSummary,
  StaffMember,
  StaffRoleType,
} from "./types";

function countByRole(team: StaffMember[]): Record<StaffRoleType, number> {
  return STAFF_ROLE_ORDER.reduce(
    (acc, roleType) => {
      acc[roleType] = team.filter((member) => member.roleType === roleType).length;
      return acc;
    },
    {} as Record<StaffRoleType, number>,
  );
}

function staffByRatio(covers: number, ratio: number): number {
  if (covers < ratio) return 0;
  return Math.ceil(covers / ratio);
}

function getDailyCovers(results: DashboardResults) {
  return DAYS.map((day) => {
    const diurno =
      results.coversMatrix.desayuno[day] + results.coversMatrix.almuerzo[day];
    const vespertino =
      results.coversMatrix.merienda[day] + results.coversMatrix.cena[day];
    const morning = diurno;
    const afternoon = vespertino;
    const total = results.dayTotals[day];
    return { day, diurno, vespertino, morning, afternoon, total };
  });
}

function barNeedForShift(
  covers: number,
  barRatio: number,
  barEventualRatio: number,
): number {
  if (covers <= 0) return 0;
  const base = Math.ceil(covers / barRatio);
  const extra =
    covers > barRatio * base
      ? Math.ceil((covers - barRatio * base) / barEventualRatio)
      : 0;
  return base + extra;
}

// Weekdays Mon–Thu are used to size the permanent bar team.
// Fri–Sun peaks are handled as eventual/weekend reinforcement.
const WEEKDAYS_CORE: Day[] = ["lunes", "martes", "miércoles", "jueves"];

function computeBarHeadcount(
  results: DashboardResults,
  staffingParams: StaffingParams,
): { peakDiurnoBar: number; peakVespertinoBar: number; total: number } {
  const { barRatio, barPmRatio } = staffingParams;
  const share = (slot: (typeof TIME_SLOTS)[number]) => {
    const shares = {
      desayuno: staffingParams.rushDesayunoShare,
      almuerzo: staffingParams.rushAlmuerzoShare,
      merienda: staffingParams.rushMeriendaShare,
      cena: staffingParams.rushCenaShare,
    };
    return Math.min(1, Math.max(0, shares[slot] / 100));
  };

  // Only consider Mon–Thu for permanent team sizing
  const wdPeakDiurno = Math.max(
    0,
    ...WEEKDAYS_CORE.map((day) =>
      Math.max(
        results.coversMatrix.desayuno[day] * share("desayuno"),
        results.coversMatrix.almuerzo[day] * share("almuerzo"),
      ),
    ),
  );
  const wdPeakVespertino = Math.max(
    0,
    ...WEEKDAYS_CORE.map((day) =>
      Math.max(
        results.coversMatrix.merienda[day] * share("merienda"),
        results.coversMatrix.cena[day] * share("cena"),
      ),
    ),
  );

  const peakDiurnoBar    = Math.max(1, Math.ceil(wdPeakDiurno    / barRatio));
  const peakVespertinoBar = Math.max(0, Math.ceil(wdPeakVespertino / barPmRatio));

  return {
    peakDiurnoBar,
    peakVespertinoBar,
    total: peakDiurnoBar + peakVespertinoBar,
  };
}

export function calculateRequiredHeadcount(
  results: DashboardResults,
  staffingParams: StaffingParams,
): RequiredHeadcount {
  const {
    waiterRatioDay,
    waiterRatioDinner,
    eventualThresholdPercent,
    cajeroAmRatio,
    cajeroPmRatio,
    recepcionistaPmRatio,
    jefeSalonAmRatio,
    jefeSalonPmRatio,
    jefeCocinaPmThreshold,
    ayudanteAmRatio,
    ayudantePmRatio,
    bachaPmRatio,
  } = staffingParams;

  const eventualThreshold = eventualThresholdPercent / 100;
  const shiftsPerWeek = shiftsPerPersonWeek(staffingParams);
  const dailyCovers = getDailyCovers(results);

  // Each waiter (AM or PM) covers 2 service-slots per working day:
  //   AM: desayuno + almuerzo   PM: merienda + cena
  const workingDays = Math.max(1, 7 - staffingParams.weeklyDayOff);
  const serviceSlotsPerPersonPerWeek = 2 * workingDays;

  // Rush window duration helpers
  function rushDuration(slot: (typeof TIME_SLOTS)[number]): number {
    const starts: Record<string, number> = {
      desayuno: staffingParams.rushDesayunoStart,
      almuerzo: staffingParams.rushAlmuerzoStart,
      merienda: staffingParams.rushMeriendaStart,
      cena:     staffingParams.rushCenaStart,
    };
    const ends: Record<string, number> = {
      desayuno: staffingParams.rushDesayunoEnd,
      almuerzo: staffingParams.rushAlmuerzoEnd,
      merienda: staffingParams.rushMeriendaEnd,
      cena:     staffingParams.rushCenaEnd,
    };
    return Math.max(0.5, ends[slot] - starts[slot]);
  }

  function dwellTime(slot: (typeof TIME_SLOTS)[number]): number {
    const map: Record<string, number> = {
      desayuno: staffingParams.dwellDesayuno,
      almuerzo: staffingParams.dwellAlmuerzo,
      merienda: staffingParams.dwellMerienda,
      cena:     staffingParams.dwellCena,
    };
    return Math.max(0.25, map[slot]);
  }

  function rushShare(slot: (typeof TIME_SLOTS)[number]): number {
    const map: Record<string, number> = {
      desayuno: staffingParams.rushDesayunoShare,
      almuerzo: staffingParams.rushAlmuerzoShare,
      merienda: staffingParams.rushMeriendaShare,
      cena:     staffingParams.rushCenaShare,
    };
    return Math.min(1, Math.max(0, map[slot] / 100));
  }

  // --- Camareros: turno AM (desayuno + almuerzo + merienda) y turno PM (cena) ---
  // El equipo AM es un pool único que atiende los tres servicios de forma secuencial.
  // El tamaño del equipo lo determina el PEOR PICO individual de los tres slots,
  // no la suma de ellos. Lo mismo aplica al turno PM (cena).
  // Se toma el día más exigente de la semana para dimensionar el equipo.

  const AM_SLOTS_LIST = ["desayuno", "almuerzo", "merienda"] as const;
  const PM_SLOTS_LIST = ["cena"] as const;

  let maxAMNeeded = 0; // camareros AM necesarios en el día más exigente
  let maxPMNeeded = 0; // camareros PM necesarios en el día más exigente

  for (const day of DAYS) {
    // Pico AM: el máximo de los tres slots AM en este día
    let peakAM = 0;
    for (const slot of AM_SLOTS_LIST) {
      const covers = results.coversMatrix[slot][day];
      if (covers <= 0) continue;
      const rd = rushDuration(slot);
      const dwell = dwellTime(slot);
      const rushCovers = covers * rushShare(slot);
      const rawPeak = (rushCovers / rd) * dwell;
      const peakSim = Math.min(covers, rawPeak);
      peakAM = Math.max(peakAM, Math.ceil(peakSim / waiterRatioDay));
    }

    // Pico PM: solo cena
    let peakPM = 0;
    for (const slot of PM_SLOTS_LIST) {
      const covers = results.coversMatrix[slot][day];
      if (covers <= 0) continue;
      const rd = rushDuration(slot);
      const dwell = dwellTime(slot);
      const rushCovers = covers * rushShare(slot);
      const rawPeak = (rushCovers / rd) * dwell;
      const peakSim = Math.min(covers, rawPeak);
      peakPM = Math.max(peakPM, Math.ceil(peakSim / waiterRatioDinner));
    }

    maxAMNeeded = Math.max(maxAMNeeded, peakAM);
    maxPMNeeded = Math.max(maxPMNeeded, peakPM);
  }

  // Los días de franco se asignan a días de baja demanda (lunes-miércoles);
  // en los días de alta demanda (vie-dom) trabaja todo el equipo.
  // Por eso el tamaño del equipo = requerimiento del día pico.
  const cam_am = Math.max(1, maxAMNeeded);
  const cam_pm = Math.max(1, maxPMNeeded);
  const cam    = cam_am + cam_pm;

  const cr = Math.max(1, Math.round(cam * 0.2));
  // Eventuales (CE) no forman parte de la dotación permanente.
  // Son refuerzo ad-hoc para picos de fin de semana — se capturan en eventualAnalysis.
  const ce = 0;

  // Kitchen rush peak = covers del slot más exigente del turno (no la suma del turno completo).
  // AM: el almuerzo es el rush pico; PM: la cena es el rush pico.
  const peakMorning = Math.max(
    ...DAYS.map((d) => Math.max(
      (results.coversMatrix.desayuno[d] ?? 0) * rushShare("desayuno"),
      (results.coversMatrix.almuerzo[d] ?? 0) * rushShare("almuerzo"),
    )),
    0,
  );
  const peakAfternoon = Math.max(
    ...DAYS.map((d) => Math.max(
      (results.coversMatrix.merienda[d] ?? 0) * rushShare("merienda"),
      (results.coversMatrix.cena[d] ?? 0) * rushShare("cena"),
    )),
    0,
  );
  const barHeadcount = computeBarHeadcount(results, staffingParams);
  const cocinerosAm = peakMorning > 0 ? Math.max(1, Math.ceil(peakMorning / ayudanteAmRatio)) : 0;
  const ayudantesPm = peakAfternoon > 0 ? Math.max(1, Math.ceil(peakAfternoon / ayudantePmRatio)) : 0;


  return {
    // FOH
    GER: 1,
    ENC: 1,
    CAJ_AM: staffByRatio(peakMorning, cajeroAmRatio),
    CAJ_PM: staffByRatio(peakAfternoon, cajeroPmRatio),
    JFS_AM: staffByRatio(peakMorning, jefeSalonAmRatio),
    JFS_PM: staffByRatio(peakAfternoon, jefeSalonPmRatio),
    REC_PM: staffByRatio(peakAfternoon, recepcionistaPmRatio),
    CAM: cam,
    cam_am,
    cam_pm,
    CR: cr,
    CE: ce,
    BC: barHeadcount.total,
    bc_diurno:    barHeadcount.peakDiurnoBar,
    bc_vespertino: barHeadcount.peakVespertinoBar,
    // BOH fijos
    LIS: 1,
    BRUNO: 1,
    // Cocina AM: producción + jefe son fijos; cocinero AM escala por demanda.
    JEFE_COC_AM: 1,
    JEFE_COC_PM: peakAfternoon >= jefeCocinaPmThreshold && peakAfternoon > 0 ? 1 : 0,
    PAR_AM:  1,
    FUE_AM:  cocinerosAm,
    GUAR_AM: 0,
    FREI_AM: 0,
    BACH_AM: 0,
    // Cocina PM: estaciones especializadas que se activan progresivamente por demanda.
    PAR_PM:  ayudantesPm >= 1 ? 1 : 0,
    FUE_PM:  ayudantesPm >= 2 ? 1 : 0,
    GUAR_PM: ayudantesPm >= 3 ? 1 : 0,
    FREI_PM: ayudantesPm >= 4 ? Math.max(1, ayudantesPm - 3) : 0,
    BACH_PM: peakAfternoon > 0 ? Math.max(1, Math.ceil(peakAfternoon / bachaPmRatio)) : 0,
  };
}

export function buildSuggestedTeam(
  requiredCounts: RequiredHeadcount,
): StaffMember[] {
  const team: StaffMember[] = [];

  for (const roleType of STAFF_ROLE_ORDER) {
    if (roleType === "CAM") {
      // Even indices → AM schedule, odd → PM.
      // Create exactly cam_am AM waiters and cam_pm PM waiters.
      for (let i = 0; i < requiredCounts.cam_am; i++) {
        team.push(createStaffMember("CAM", i * 2));       // 0, 2, 4… → AM
      }
      for (let i = 0; i < requiredCounts.cam_pm; i++) {
        team.push(createStaffMember("CAM", i * 2 + 1));   // 1, 3, 5… → PM
      }
      continue;
    }

    if (roleType === "BC") {
      // Even indices → AM (diurno), odd → PM (vespertino).
      for (let i = 0; i < requiredCounts.bc_diurno; i++) {
        team.push(createStaffMember("BC", i * 2));        // 0, 2… → AM barista
      }
      for (let i = 0; i < requiredCounts.bc_vespertino; i++) {
        team.push(createStaffMember("BC", i * 2 + 1));    // 1, 3… → PM barista
      }
      continue;
    }

    const count = requiredCounts[roleType];
    for (let index = 0; index < count; index += 1) {
      team.push(createStaffMember(roleType, index));
    }
  }

  return team;
}

function buildActionMessage(
  status: StaffActionStatus,
  current: number,
  required: number,
): string {
  if (status === "ok") {
    return `OK — Dotación exacta (${current}/${required})`;
  }
  if (status === "excedente") {
    const diff = current - required;
    return `EXCEDENTE ${diff} — Tenés ${current}, demanda pide ${required} (podés reubicar o reducir horas)`;
  }
  const diff = required - current;
  return `FALTANTE ${diff} — Tenés ${current}, demanda pide ${required} (contratar o reasignar)`;
}

export function compareStaffing(
  managerTeam: StaffMember[],
  requiredCounts: RequiredHeadcount,
): StaffAction[] {
  const currentCounts = countByRole(managerTeam);
  const countShift = (roleType: StaffRoleType, shift: "am" | "pm") =>
    managerTeam.filter(
      (member) => member.roleType === roleType && getMemberShiftGroup(member) === shift,
    ).length;

  const rows: Array<{ roleType: StaffRoleType; label: string; current: number; required: number }> = [
    { roleType: "LIS", label: ROLE_CONFIG.LIS.groupLabel, current: currentCounts.LIS, required: requiredCounts.LIS },
    { roleType: "BRUNO", label: ROLE_CONFIG.BRUNO.groupLabel, current: currentCounts.BRUNO, required: requiredCounts.BRUNO },
    { roleType: "GER", label: ROLE_CONFIG.GER.groupLabel, current: currentCounts.GER, required: requiredCounts.GER },
    { roleType: "ENC", label: ROLE_CONFIG.ENC.groupLabel, current: currentCounts.ENC, required: requiredCounts.ENC },
    { roleType: "CAJ_AM", label: ROLE_CONFIG.CAJ_AM.groupLabel, current: currentCounts.CAJ_AM, required: requiredCounts.CAJ_AM },
    { roleType: "JFS_AM", label: ROLE_CONFIG.JFS_AM.groupLabel, current: currentCounts.JFS_AM, required: requiredCounts.JFS_AM },
    { roleType: "CAM", label: "Camarero AM", current: countShift("CAM", "am"), required: requiredCounts.cam_am },
    { roleType: "CE", label: "Comis / Eventual AM", current: countShift("CE", "am"), required: 0 },
    { roleType: "BC", label: "Barra / Café AM", current: countShift("BC", "am"), required: requiredCounts.bc_diurno },
    { roleType: "CR", label: ROLE_CONFIG.CR.groupLabel, current: currentCounts.CR, required: requiredCounts.CR },
    { roleType: "PAR_AM", label: ROLE_CONFIG.PAR_AM.groupLabel, current: currentCounts.PAR_AM, required: requiredCounts.PAR_AM },
    { roleType: "JEFE_COC_AM", label: ROLE_CONFIG.JEFE_COC_AM.groupLabel, current: currentCounts.JEFE_COC_AM, required: requiredCounts.JEFE_COC_AM },
    { roleType: "FUE_AM", label: ROLE_CONFIG.FUE_AM.groupLabel, current: currentCounts.FUE_AM, required: requiredCounts.FUE_AM },
    { roleType: "CAJ_PM", label: ROLE_CONFIG.CAJ_PM.groupLabel, current: currentCounts.CAJ_PM, required: requiredCounts.CAJ_PM },
    { roleType: "JFS_PM", label: ROLE_CONFIG.JFS_PM.groupLabel, current: currentCounts.JFS_PM, required: requiredCounts.JFS_PM },
    { roleType: "REC_PM", label: ROLE_CONFIG.REC_PM.groupLabel, current: currentCounts.REC_PM, required: requiredCounts.REC_PM },
    { roleType: "CAM", label: "Camarero PM", current: countShift("CAM", "pm"), required: requiredCounts.cam_pm },
    { roleType: "CE", label: "Comis / Eventual PM", current: countShift("CE", "pm"), required: 0 },
    { roleType: "BC", label: "Barra / Café PM", current: countShift("BC", "pm"), required: requiredCounts.bc_vespertino },
    { roleType: "JEFE_COC_PM", label: ROLE_CONFIG.JEFE_COC_PM.groupLabel, current: currentCounts.JEFE_COC_PM, required: requiredCounts.JEFE_COC_PM },
    { roleType: "PAR_PM", label: ROLE_CONFIG.PAR_PM.groupLabel, current: currentCounts.PAR_PM, required: requiredCounts.PAR_PM },
    { roleType: "FUE_PM", label: ROLE_CONFIG.FUE_PM.groupLabel, current: currentCounts.FUE_PM, required: requiredCounts.FUE_PM },
    { roleType: "GUAR_PM", label: ROLE_CONFIG.GUAR_PM.groupLabel, current: currentCounts.GUAR_PM, required: requiredCounts.GUAR_PM },
    { roleType: "FREI_PM", label: ROLE_CONFIG.FREI_PM.groupLabel, current: currentCounts.FREI_PM, required: requiredCounts.FREI_PM },
    { roleType: "BACH_PM", label: ROLE_CONFIG.BACH_PM.groupLabel, current: currentCounts.BACH_PM, required: requiredCounts.BACH_PM },
  ];

  return rows.filter((row) => row.required > 0 || row.current > 0).map((row) => {
    const { roleType, label, current, required } = row;
    let status: StaffActionStatus = "ok";
    if (current > required) status = "excedente";
    if (current < required) status = "faltante";

    return {
      roleType,
      label,
      current,
      required,
      status,
      message: buildActionMessage(status, current, required),
    };
  });
}

function getMaturityLevel(monthlyCovers: number): {
  level: string;
  description: string;
} {
  if (monthlyCovers < 4000) {
    return {
      level: "NIVEL 1 — Apertura (roles combinados)",
      description: "Estructura base con roles fijos y mínima especialización.",
    };
  }
  if (monthlyCovers < 7000) {
    return {
      level: "NIVEL 2 — Crecimiento (especialización parcial)",
      description: "Se activan roles dependientes según picos de demanda.",
    };
  }
  return {
    level: "NIVEL 3 — Consolidación (estructura ampliada)",
    description: "Demanda alta: jefes de salón, caja AM y recepción dedicada.",
  };
}

function buildMaturityRoles(
  requiredCounts: RequiredHeadcount,
): MaturityRoleRow[] {
  const row = (roleType: StaffRoleType, required: number, label = ROLE_CONFIG[roleType].label): MaturityRoleRow => {
    const config = ROLE_CONFIG[roleType];
    return {
      roleLabel: label,
      dependency: config.dependency,
      reason: config.maturityReason,
      trigger: config.maturityTrigger,
      required,
      active: required > 0,
    };
  };

  return [
    row("LIS", requiredCounts.LIS),
    row("BRUNO", requiredCounts.BRUNO),
    row("GER", requiredCounts.GER),
    row("ENC", requiredCounts.ENC),
    row("CAJ_AM", requiredCounts.CAJ_AM),
    row("JFS_AM", requiredCounts.JFS_AM),
    row("CAM", requiredCounts.cam_am, "Camarero AM"),
    row("CE", 0, "Comis / Eventual AM"),
    row("BC", requiredCounts.bc_diurno, "Barra / Café AM"),
    row("CR", requiredCounts.CR),
    row("PAR_AM", requiredCounts.PAR_AM),
    row("JEFE_COC_AM", requiredCounts.JEFE_COC_AM),
    row("FUE_AM", requiredCounts.FUE_AM),
    row("CAJ_PM", requiredCounts.CAJ_PM),
    row("JFS_PM", requiredCounts.JFS_PM),
    row("REC_PM", requiredCounts.REC_PM),
    row("CAM", requiredCounts.cam_pm, "Camarero PM"),
    row("CE", 0, "Comis / Eventual PM"),
    row("BC", requiredCounts.bc_vespertino, "Barra / Café PM"),
    row("JEFE_COC_PM", requiredCounts.JEFE_COC_PM),
    row("PAR_PM", requiredCounts.PAR_PM),
    row("FUE_PM", requiredCounts.FUE_PM),
    row("GUAR_PM", requiredCounts.GUAR_PM),
    row("FREI_PM", requiredCounts.FREI_PM),
    row("BACH_PM", requiredCounts.BACH_PM),
  ];
}

const WEEKEND_DAYS: Day[] = ["sábado", "domingo"];
const WAITER_RATIO_AM_CONST = 30;

function buildEventualAnalysis(
  results: DashboardResults,
  cam: number,
  staffingParams: StaffingParams,
): EventualAnalysis {
  const baseCapacityPerDay = cam * WAITER_RATIO_AM_CONST;
  const avgHours =
    (staffingParams.minHoursEventual + staffingParams.maxHoursEventual) / 2;

  const overflowDays = DAYS.filter((day) => {
    const dayTotal = results.dayTotals[day];
    return dayTotal > baseCapacityPerDay;
  });

  const weekendOverflowCount = overflowDays.filter((d) =>
    WEEKEND_DAYS.includes(d),
  ).length;
  const weekdayOverflowCount = overflowDays.length - weekendOverflowCount;
  const estimatedHoursPerWeek = overflowDays.length * avgHours;

  let recommendation: EventualAnalysis["recommendation"];
  if (overflowDays.length === 0) recommendation = "none";
  else if (overflowDays.length <= 3) recommendation = "eventual";
  else recommendation = "hire_fixed"; // 4+ days at avg hours → worth a fixed hire

  return {
    overflowDayCount: overflowDays.length,
    weekendOverflowCount,
    weekdayOverflowCount,
    overflowDays,
    estimatedHoursPerWeek,
    recommendation,
  };
}

export function calculateStaffingSummary(
  results: DashboardResults,
  monthlyCovers: number,
  managerTeam: StaffMember[],
  staffingParams: StaffingParams,
): StaffingSummary {
  const requiredCounts = calculateRequiredHeadcount(results, staffingParams);
  const requiredTotal = STAFF_ROLE_ORDER.reduce(
    (sum, role) => sum + requiredCounts[role],
    0,
  );
  const fixedTotal = FIXED_STAFF_ROLES.reduce(
    (sum, role) => sum + requiredCounts[role],
    0,
  );
  const demandTotal = DEMAND_STAFF_ROLES.reduce(
    (sum, role) => sum + requiredCounts[role],
    0,
  );
  const currentTotal = managerTeam.length;
  const difference = currentTotal - requiredTotal;
  const actions = compareStaffing(managerTeam, requiredCounts);
  const suggestedTeam = buildSuggestedTeam(requiredCounts);
  const maturity = getMaturityLevel(monthlyCovers);
  const dailyCovers = getDailyCovers(results);
  const peakDayCovers = Math.max(...dailyCovers.map((entry) => entry.total), 0);
  const peakMorningCovers = Math.max(
    ...dailyCovers.map((entry) => entry.morning),
    0,
  );
  const barHeadcount = computeBarHeadcount(results, staffingParams);

  let bannerMessage: string;
  let bannerTone: StaffingSummary["bannerTone"];

  if (difference === 0) {
    bannerMessage = `EQUIPO OK — tenés ${currentTotal} personas, la demanda pide ${requiredTotal} (${fixedTotal} fijas + ${demandTotal} por demanda)`;
    bannerTone = "ok";
  } else if (difference > 0) {
    bannerMessage = `DOTACIÓN DINÁMICA — según demanda actual | EQUIPO OK — tenés ${currentTotal} personas, la demanda pide ${requiredTotal} (excedente ${difference})`;
    bannerTone = "excedente";
  } else {
    bannerMessage = `DOTACIÓN DINÁMICA — según demanda actual | FALTANTE — tenés ${currentTotal} personas, la demanda pide ${requiredTotal} (faltan ${Math.abs(difference)})`;
    bannerTone = "faltante";
  }

  const eventualAnalysis = buildEventualAnalysis(
    results,
    requiredCounts.cam_am, // use AM waiter headcount as baseline
    staffingParams,
  );

  return {
    requiredCounts,
    eventualAnalysis,
    requiredTotal,
    fixedTotal,
    demandTotal,
    currentTotal,
    difference,
    bannerMessage,
    bannerTone,
    actions,
    suggestedTeam,
    maturityLevel: maturity.level,
    maturityDescription: maturity.description,
    maturityRoles: buildMaturityRoles(requiredCounts),
    peakDayCovers,
    peakMorningCovers,
    peakBarNeed: barHeadcount.total,
    peakDiurnoBar: barHeadcount.peakDiurnoBar,
    peakVespertinoBar: barHeadcount.peakVespertinoBar,
  };
}

export function formatStaffingRatiosSummary(params: StaffingParams): string {
  return `${params.waiterRatioDay} cub/cam (AM) · ${params.waiterRatioDinner} cub/cam (cena) · rush cena ${params.rushCenaShare}% · ${params.barRatio} cub/barra AM · ${params.barPmRatio} cub/barra PM · +${params.eventualThresholdPercent}% eventual`;
}
