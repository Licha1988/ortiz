import type { StaffingParamKey, StaffingParams } from "@/lib/staffing/params";
import type { DashboardResults, TimeSlot } from "@/lib/types";
import { DAYS } from "@/lib/types";

export type RushWindowRow = {
  slot: TimeSlot;
  label: string;
  startKey: StaffingParamKey;
  endKey: StaffingParamKey;
  shareKey: StaffingParamKey;
  dwellKey: StaffingParamKey;
};

export const RUSH_WINDOW_ROWS: RushWindowRow[] = [
  {
    slot: "desayuno",
    label: "Desayuno",
    startKey: "rushDesayunoStart",
    endKey: "rushDesayunoEnd",
    shareKey: "rushDesayunoShare",
    dwellKey: "dwellDesayuno",
  },
  {
    slot: "almuerzo",
    label: "Almuerzo",
    startKey: "rushAlmuerzoStart",
    endKey: "rushAlmuerzoEnd",
    shareKey: "rushAlmuerzoShare",
    dwellKey: "dwellAlmuerzo",
  },
  {
    slot: "merienda",
    label: "Merienda",
    startKey: "rushMeriendaStart",
    endKey: "rushMeriendaEnd",
    shareKey: "rushMeriendaShare",
    dwellKey: "dwellMerienda",
  },
  {
    slot: "cena",
    label: "Cena",
    startKey: "rushCenaStart",
    endKey: "rushCenaEnd",
    shareKey: "rushCenaShare",
    dwellKey: "dwellCena",
  },
];

export function formatRushHour(value: number): string {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function rushWindowLabel(params: StaffingParams, row: RushWindowRow): string {
  const start = params[row.startKey] as number;
  const end = params[row.endKey] as number;
  return `${formatRushHour(start)} – ${formatRushHour(end)}`;
}

export type RushSlotMetrics = {
  slot: TimeSlot;
  peakSlotCovers: number;
  rushCovers: number;
  peakSimultaneous: number;
};

function rushDuration(params: StaffingParams, row: RushWindowRow): number {
  const start = params[row.startKey] as number;
  const end = params[row.endKey] as number;
  return Math.max(0.5, end - start);
}

function rushShare(params: StaffingParams, row: RushWindowRow): number {
  return Math.min(1, Math.max(0, (params[row.shareKey] as number) / 100));
}

function dwellHours(params: StaffingParams, row: RushWindowRow): number {
  return Math.max(0.25, params[row.dwellKey] as number);
}

export function computeRushSlotMetrics(
  results: DashboardResults,
  params: StaffingParams,
): Record<TimeSlot, RushSlotMetrics> {
  return RUSH_WINDOW_ROWS.reduce(
    (acc, row) => {
      const peakSlotCovers = Math.max(
        0,
        ...DAYS.map((day) => results.coversMatrix[row.slot][day] ?? 0),
      );
      const share = rushShare(params, row);
      const rushCovers = peakSlotCovers * share;
      const duration = rushDuration(params, row);
      const dwell = dwellHours(params, row);
      const rawPeak = (rushCovers / duration) * dwell;

      acc[row.slot] = {
        slot: row.slot,
        peakSlotCovers,
        rushCovers,
        peakSimultaneous: Math.min(peakSlotCovers, rawPeak),
      };
      return acc;
    },
    {} as Record<TimeSlot, RushSlotMetrics>,
  );
}
