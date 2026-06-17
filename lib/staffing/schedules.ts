import { DAYS, type Day } from "@/lib/types";
import { ROLE_CONFIG } from "./role-config";
import type { StaffMember, StaffRoleType, WeekSchedule } from "./types";

const WEEKEND: Day[] = ["sábado", "domingo"];
const DAY_OFF_POOL: Day[] = ["lunes", "martes", "miércoles", "domingo"];

function balancedDayOff(index: number, offset = 0): Day {
  return DAY_OFF_POOL[(index + offset) % DAY_OFF_POOL.length];
}

function buildSchedule(
  dayOff: Day,
  weekdayHours: string,
  weekendHours: string,
): WeekSchedule {
  return DAYS.reduce(
    (acc, day) => {
      if (day === dayOff) acc[day] = "FRANCO";
      else if (WEEKEND.includes(day)) acc[day] = weekendHours;
      else acc[day] = weekdayHours;
      return acc;
    },
    {} as WeekSchedule,
  );
}

const SCHEDULE_TEMPLATES: Record<
  StaffRoleType,
  (index: number) => { schedule: WeekSchedule; dayOff: Day | null }
> = {
  GER: (_index) => {
    // Lun–Jue tarde-noche, Vie–Sáb PM, Domingo franco
    const schedule: WeekSchedule = {
      lunes:      "16:00-00:00",
      martes:     "16:00-00:00",
      miércoles:  "16:00-00:00",
      jueves:     "16:00-00:00",
      viernes:    "17:00-00:00",
      sábado:     "17:00-00:00",
      domingo:    "FRANCO",
    };
    return { schedule, dayOff: "domingo" };
  },
  ENC: (_index) => {
    // Presente fines de semana (alta demanda), franco el martes
    const schedule: WeekSchedule = {
      lunes:      "09:00-17:00",
      martes:     "FRANCO",
      miércoles:  "09:00-17:00",
      jueves:     "09:00-17:00",
      viernes:    "09:00-17:00",
      sábado:     "09:00-17:00",
      domingo:    "09:00-17:00",
    };
    return { schedule, dayOff: "martes" };
  },
  CAJ_PM: (index) => {
    const dayOff = balancedDayOff(index);
    return {
      schedule: buildSchedule(dayOff, "15:00-22:00", "15:00-00:00"),
      dayOff,
    };
  },
  JFS_AM: (index) => {
    const dayOff = balancedDayOff(index, 1);
    return {
      schedule: buildSchedule(dayOff, "09:00-17:00", "09:00-17:00"),
      dayOff,
    };
  },
  JFS_PM: (index) => {
    const dayOff = balancedDayOff(index, 2);
    return {
      schedule: buildSchedule(dayOff, "17:00-00:00", "17:00-00:00"),
      dayOff,
    };
  },
  CAJ_AM: (index) => {
    const dayOff = balancedDayOff(index, 3);
    return {
      schedule: buildSchedule(dayOff, "09:00-17:00", "09:00-17:00"),
      dayOff,
    };
  },
  REC_PM: (index) => {
    const dayOff = balancedDayOff(index, 1);
    return {
      schedule: buildSchedule(dayOff, "17:00-00:00", "17:00-00:00"),
      dayOff,
    };
  },
  CAM: (index) => {
    // Even index  → AM shift (09:00-17:00)
    // Odd index   → PM shift (15:00-22:00 weekdays, 17:00-00:00 weekends)
    // The 2nd AM waiter (index=2) starts at 11:00 on weekdays to cover the
    // almuerzo peak rather than doubling on desayuno — staggered entry.
    const dayOff = balancedDayOff(index);
    const isAM = index % 2 === 0;
    const isSecondAM = index === 2; // staggered start for 2nd AM waiter
    const schedule = DAYS.reduce(
      (acc, day) => {
        if (day === dayOff) { acc[day] = "FRANCO"; return acc; }
        if (isAM) {
          acc[day] = WEEKEND.includes(day)
            ? "09:00-17:00"
            : isSecondAM
              ? "11:00-19:00"   // staggered: covers almuerzo+merienda peak
              : "09:00-17:00";
        } else {
          acc[day] = WEEKEND.includes(day) ? "17:00-00:00" : "15:00-22:00";
        }
        return acc;
      },
      {} as WeekSchedule,
    );
    return { schedule, dayOff };
  },
  CR: (index) => {
    const dayOff = balancedDayOff(index, 2);
    const pmCoverageDay: Day = index % 2 === 0 ? "jueves" : "domingo";
    const schedule = DAYS.reduce(
      (acc, day) => {
        if (day === dayOff) acc[day] = "FRANCO";
        else if (day === pmCoverageDay) acc[day] = "17:00-00:00";
        else acc[day] = "09:00-17:00";
        return acc;
      },
      {} as WeekSchedule,
    );
    return { schedule, dayOff };
  },
  CE: (index) => {
    // Eventual: no fixed day off — available all 7 days
    const schedule = DAYS.reduce(
      (acc, day) => {
        acc[day] = index % 2 === 0 ? "09:00-17:00" : "17:00-00:00";
        return acc;
      },
      {} as WeekSchedule,
    );
    return { schedule, dayOff: null };
  },
  BC: (index) => {
    // Even → AM barista, odd → PM barista.
    // 1st AM (0): abre desde las 9 — desayuno + almuerzo.
    // 2nd AM (2): entra al mediodía — cubre almuerzo peak + merienda (12:00-20:00).
    // 1st PM (1): turno vespertino estándar (15:00-22:00).
    // 2nd PM (3): entrada más tarde para reforzar cena (17:00-00:00).
    const dayOff = balancedDayOff(index, 1);
    const isDiurno = index % 2 === 0;
    if (isDiurno) {
      const isSecond = index === 2;
      return {
        schedule: buildSchedule(
          dayOff,
          isSecond ? "12:00-20:00" : "09:00-17:00",
          isSecond ? "11:00-19:00" : "09:00-18:00",
        ),
        dayOff,
      };
    }
    const isSecond = index === 3;
    return {
      schedule: buildSchedule(
        dayOff,
        isSecond ? "17:00-00:00" : "15:00-22:00",
        isSecond ? "17:00-00:00" : "15:00-00:00",
      ),
      dayOff,
    };
  },

  // ── Dirección ──────────────────────────────────────────────────────────────
  LIS: (_index) => {
    // Socio operativo — sin horario fijo asignado
    const blank = DAYS.reduce((acc, day) => { acc[day] = "—"; return acc; }, {} as WeekSchedule);
    return { schedule: blank, dayOff: null };
  },
  BRUNO: (_index) => {
    // Lun+Mié+Dom AM, Jue–Sáb PM, Martes franco (mismo que Encargado, no pisa al Gerente que descansa el domingo)
    const schedule: WeekSchedule = {
      lunes:      "09:00-17:00",
      martes:     "FRANCO",
      miércoles:  "09:00-17:00",
      jueves:     "15:00-23:00",
      viernes:    "15:00-23:00",
      sábado:     "15:00-23:00",
      domingo:    "09:00-17:00",
    };
    return { schedule, dayOff: "martes" };
  },
  JEFE_COC_AM: (index) => {
    const dayOff = balancedDayOff(index, 3);
    return { schedule: buildSchedule(dayOff, "09:00-17:00", "09:00-17:00"), dayOff };
  },
  JEFE_COC_PM: (index) => {
    const dayOff = balancedDayOff(index, 2);
    return { schedule: buildSchedule(dayOff, "17:00-00:00", "17:00-00:00"), dayOff };
  },

  // ── BOH AM ─────────────────────────────────────────────────────────────────
  // index 0 → entrada estándar (09:00, prep + servicio completo)
  // index 1 → entrada escalonada (11:00, refuerzo pico almuerzo + merienda)
  PAR_AM: (index) => {
    const dayOff = balancedDayOff(index);
    const start  = index === 0 ? "09:00-17:00" : "11:00-19:00";
    return { schedule: buildSchedule(dayOff, start, "09:00-17:00"), dayOff };
  },
  FUE_AM: (index) => {
    const dayOff = balancedDayOff(index, 1);
    const start  = index === 0 ? "09:00-17:00" : "11:00-19:00";
    return { schedule: buildSchedule(dayOff, start, "09:00-17:00"), dayOff };
  },
  GUAR_AM: (index) => {
    const dayOff = balancedDayOff(index, 2);
    const start  = index === 0 ? "09:00-17:00" : "11:00-19:00";
    return { schedule: buildSchedule(dayOff, start, "09:00-17:00"), dayOff };
  },
  FREI_AM: (index) => {
    const dayOff = balancedDayOff(index, 3);
    const start  = index === 0 ? "09:00-17:00" : "11:00-19:00";
    return { schedule: buildSchedule(dayOff, start, "09:00-17:00"), dayOff };
  },
  BACH_AM: (index) => {
    // Bacha empieza cuando se acumula vajilla; el 2do entra al pico
    const dayOff = balancedDayOff(index, 1);
    const start  = index === 0 ? "10:00-18:00" : "12:00-20:00";
    return { schedule: buildSchedule(dayOff, start, "10:00-18:00"), dayOff };
  },

  // ── BOH PM ─────────────────────────────────────────────────────────────────
  // index 0 → entra a las 16:00 (prep cena)
  // index 1 → entrada escalonada 18:00 (refuerzo pico cena)
  PAR_PM: (index) => {
    const dayOff = balancedDayOff(index);
    const start  = index === 0 ? "16:00-00:00" : "18:00-02:00";
    return { schedule: buildSchedule(dayOff, start, start), dayOff };
  },
  FUE_PM: (index) => {
    const dayOff = balancedDayOff(index, 1);
    const start  = index === 0 ? "16:00-00:00" : "18:00-02:00";
    return { schedule: buildSchedule(dayOff, start, start), dayOff };
  },
  GUAR_PM: (index) => {
    const dayOff = balancedDayOff(index, 2);
    const start  = index === 0 ? "16:00-00:00" : "18:00-02:00";
    return { schedule: buildSchedule(dayOff, start, start), dayOff };
  },
  FREI_PM: (index) => {
    const dayOff = balancedDayOff(index, 3);
    const start  = index === 0 ? "16:00-00:00" : "18:00-02:00";
    return { schedule: buildSchedule(dayOff, start, start), dayOff };
  },
  BACH_PM: (index) => {
    // Bacha PM entra cuando el servicio de cena genera vajilla
    const dayOff = balancedDayOff(index, 1);
    const start  = index === 0 ? "17:00-01:00" : "19:00-03:00";
    return { schedule: buildSchedule(dayOff, start, start), dayOff };
  },
};

export function parseShiftHours(value: string): number {
  if (value === "FRANCO" || !value.trim()) return 0;
  const match = value.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const start = Number(match[1]) * 60 + Number(match[2]);
  let end = Number(match[3]) * 60 + Number(match[4]);
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}

export function computeWeeklyHours(schedule: WeekSchedule): number {
  return DAYS.reduce((total, day) => total + parseShiftHours(schedule[day]), 0);
}

export function detectDayOff(schedule: WeekSchedule): Day | null {
  return DAYS.find((day) => schedule[day] === "FRANCO") ?? null;
}

let staffIdCounter = 0;

export function createStaffMember(
  roleType: StaffRoleType,
  index: number,
  name = "",
): StaffMember {
  const { schedule, dayOff } = SCHEDULE_TEMPLATES[roleType](index);
  staffIdCounter += 1;
  return {
    id: `staff-${roleType}-${index}-${staffIdCounter}`,
    name,
    roleType,
    schedule,
    dayOff,
    weeklyHours: computeWeeklyHours(schedule),
    ...(roleType === "LIS" && { noSchedule: true }),
  };
}

export function withUpdatedSchedule(
  member: StaffMember,
  day: Day,
  value: string,
): StaffMember {
  const schedule = { ...member.schedule, [day]: value.toUpperCase() || "FRANCO" };
  return {
    ...member,
    schedule,
    dayOff: detectDayOff(schedule),
    weeklyHours: computeWeeklyHours(schedule),
  };
}

export function getRoleLabel(roleType: StaffRoleType): string {
  return ROLE_CONFIG[roleType].label;
}

export function getShiftCode(roleType: StaffRoleType): string {
  return ROLE_CONFIG[roleType].shiftCode;
}

/**
 * Determines whether a staff member works AM (9:00–17:00) or PM (17:00–close)
 * by inspecting the start hour of their first non-FRANCO shift.
 * Cutoff: shifts starting before 14:00 → AM, 14:00 or later → PM.
 */
export function getMemberShiftGroup(member: StaffMember): "am" | "pm" {
  const firstWork = Object.values(member.schedule).find((v) => v !== "FRANCO");
  if (!firstWork) return "am";
  const match = firstWork.match(/^(\d{1,2}):/);
  if (!match) return "am";
  return Number(match[1]) < 14 ? "am" : "pm";
}

export type StaffDisplayGroup = "fixed" | "am" | "pm";

export function getMemberDisplayGroup(member: StaffMember): StaffDisplayGroup {
  if (["LIS", "BRUNO", "GER"].includes(member.roleType)) return "fixed";
  if (member.roleType === "ENC" || member.roleType === "CR") return "am";
  return getMemberShiftGroup(member);
}

export function getMemberRoleLabel(member: StaffMember): string {
  const shift = getMemberShiftGroup(member);
  if (member.roleType === "CAM") return shift === "am" ? "Camarero AM" : "Camarero PM";
  if (member.roleType === "CE") {
    return shift === "am" ? "Comis / Eventual AM" : "Comis / Eventual PM";
  }
  if (member.roleType === "BC") return shift === "am" ? "Barra / Café AM" : "Barra / Café PM";
  if (member.roleType === "CR") return "Camarero AM";
  return ROLE_CONFIG[member.roleType].label;
}

const DISPLAY_ORDER = [
  "LIS", "BRUNO", "GER",
  "ENC", "CAJ_AM", "JFS_AM", "CAM:am", "CE:am", "BC:am", "CR", "PAR_AM", "JEFE_COC_AM", "FUE_AM",
  "CAJ_PM", "JFS_PM", "REC_PM", "CAM:pm", "CE:pm", "BC:pm", "JEFE_COC_PM",
  "PAR_PM", "FUE_PM", "GUAR_PM", "FREI_PM", "BACH_PM",
] as const;

export function getMemberSortRank(member: StaffMember): number {
  const shift = getMemberShiftGroup(member);
  const key =
    member.roleType === "CAM" || member.roleType === "CE" || member.roleType === "BC"
      ? `${member.roleType}:${shift}`
      : member.roleType;
  const index = DISPLAY_ORDER.indexOf(key as (typeof DISPLAY_ORDER)[number]);
  return index === -1 ? DISPLAY_ORDER.length : index;
}
