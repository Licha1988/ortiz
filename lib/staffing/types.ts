import type { Day } from "@/lib/types";
import type { StaffPosition } from "@/lib/staffing/positions";

export type StaffRoleType =
  // ── Salón (FOH) ───────────────────────────────────────────────────────────
  | "GER"
  | "ADMIN"
  | "ENC"
  | "CAJ_AM"
  | "CAJ_PM"
  | "JFS_AM"
  | "JFS_PM"
  | "REC_PM"
  | "CAM"
  | "CR"
  | "CE"
  | "BC"
  // ── Cocina (BOH) — fijos ──────────────────────────────────────────────────
  | "LIS"
  | "BRUNO"
  | "JEFE_COC_AM"
  | "JEFE_COC_PM"
  // ── Cocina (BOH) — por demanda AM ─────────────────────────────────────────
  | "PAR_AM"
  | "FUE_AM"
  | "GUAR_AM"
  | "FREI_AM"
  | "BACH_AM"
  // ── Cocina (BOH) — por demanda PM ─────────────────────────────────────────
  | "PAR_PM"
  | "FUE_PM"
  | "GUAR_PM"
  | "FREI_PM"
  | "BACH_PM";

export type WeekSchedule = Record<Day, string>;

export type StaffMember = {
  id: string;
  name: string;
  roleType: StaffRoleType;
  position?: StaffPosition;
  schedule: WeekSchedule;
  dayOff: Day | null;
  weeklyHours: number;
  noSchedule?: boolean;
  netSalary?: number;
};

export type RequiredHeadcount = Record<StaffRoleType, number> & {
  cam_am: number;      // waiters needed for AM shift (desayuno + almuerzo + merienda)
  cam_pm: number;      // waiters needed for PM shift (cena)
  bc_diurno: number;   // bar/café staff for AM shift (sized for Mon–Thu peak)
  bc_vespertino: number; // bar/café staff for PM shift (sized for Mon–Thu peak)
};

export type StaffActionStatus = "ok" | "excedente" | "faltante";

export type StaffAction = {
  roleType: StaffRoleType;
  label: string;
  current: number;
  required: number;
  status: StaffActionStatus;
  message: string;
};

export type MaturityRoleRow = {
  roleLabel: string;
  dependency: "independiente" | "dependiente";
  reason: string;
  trigger: string;
  required: number;
  active: boolean;
};

export type EventualRecommendation = "none" | "eventual" | "hire_fixed";

export type EventualAnalysis = {
  overflowDayCount: number;       // days/week where demand > base capacity
  weekendOverflowCount: number;   // how many of those are Sat/Sun
  weekdayOverflowCount: number;
  overflowDays: string[];
  estimatedHoursPerWeek: number;  // overflowDays × avgEventualHours
  recommendation: EventualRecommendation;
};

export type StaffingSummary = {
  requiredCounts: RequiredHeadcount;
  eventualAnalysis: EventualAnalysis;
  requiredTotal: number;
  fixedTotal: number;
  demandTotal: number;
  currentTotal: number;
  difference: number;
  bannerMessage: string;
  bannerTone: "ok" | "excedente" | "faltante";
  actions: StaffAction[];
  suggestedTeam: StaffMember[];
  maturityLevel: string;
  maturityDescription: string;
  maturityRoles: MaturityRoleRow[];
  peakDayCovers: number;
  peakMorningCovers: number;
  peakBarNeed: number;
  peakDiurnoBar: number;
  peakVespertinoBar: number;
};
