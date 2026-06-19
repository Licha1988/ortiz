import type { DashboardResults } from "@/lib/types";
import { DAYS } from "@/lib/types";
import {
  STAFF_POSITION_OPTIONS,
  getPositionLabel,
  type StaffEmploymentType,
  type StaffPosition,
} from "@/lib/staffing/positions";

export type PositionCoverageEntry = {
  employmentType: StaffEmploymentType;
  coverageRatio: number | null;
};

export type PositionCoverageState = Record<StaffPosition, PositionCoverageEntry>;

export type PositionCoverageProfile = PositionCoverageEntry & {
  position: StaffPosition;
  label: string;
};

const DEFAULTS_BY_POSITION: Record<StaffPosition, PositionCoverageEntry> = {
  socio_operativo: { employmentType: "independiente", coverageRatio: null },
  chef_ejecutivo: { employmentType: "independiente", coverageRatio: null },
  gerente: { employmentType: "independiente", coverageRatio: null },
  administracion: { employmentType: "independiente", coverageRatio: null },
  encargado: { employmentType: "independiente", coverageRatio: null },
  cajero: { employmentType: "dependiente", coverageRatio: 160 },
  jefe_salon: { employmentType: "dependiente", coverageRatio: 135 },
  camarero: { employmentType: "dependiente", coverageRatio: 30 },
  commis: { employmentType: "dependiente", coverageRatio: 30 },
  eventual: { employmentType: "dependiente", coverageRatio: 25 },
  barra_cafe: { employmentType: "dependiente", coverageRatio: 110 },
  jefe_cocina: { employmentType: "independiente", coverageRatio: null },
  cocinero: { employmentType: "dependiente", coverageRatio: 100 },
  ayudante_cocina: { employmentType: "dependiente", coverageRatio: 80 },
  bachero: { employmentType: "dependiente", coverageRatio: 400 },
  produccion: { employmentType: "independiente", coverageRatio: null },
  ayudante_produccion: { employmentType: "dependiente", coverageRatio: 80 },
};

export const DEFAULT_POSITION_COVERAGE: PositionCoverageState = STAFF_POSITION_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = DEFAULTS_BY_POSITION[option.id];
    return acc;
  },
  {} as PositionCoverageState,
);

export function updatePositionCoverageEmploymentType(
  state: PositionCoverageState,
  position: StaffPosition,
  employmentType: StaffEmploymentType,
): PositionCoverageState {
  const base = DEFAULTS_BY_POSITION[position];
  return {
    ...state,
    [position]: {
      employmentType,
      coverageRatio:
        employmentType === "independiente"
          ? null
          : (state[position].coverageRatio ?? base.coverageRatio),
    },
  };
}

export function updatePositionCoverageRatio(
  state: PositionCoverageState,
  position: StaffPosition,
  ratio: number,
): PositionCoverageState {
  return {
    ...state,
    [position]: { ...state[position], coverageRatio: ratio },
  };
}

export function getPeakDayCovers(results: DashboardResults): number {
  return Math.max(0, ...DAYS.map((day) => results.dayTotals[day] ?? 0));
}

export function listPositionCoverageProfiles(
  coverage: PositionCoverageState,
): PositionCoverageProfile[] {
  return STAFF_POSITION_OPTIONS.map((option) => ({
    position: option.id,
    label: getPositionLabel(option.id),
    ...coverage[option.id],
  }));
}

export function mergePositionCoverage(stored?: Partial<PositionCoverageState>): PositionCoverageState {
  return STAFF_POSITION_OPTIONS.reduce((acc, option) => {
    const base = DEFAULT_POSITION_COVERAGE[option.id];
    const saved = stored?.[option.id];
    acc[option.id] = {
      employmentType: saved?.employmentType ?? base.employmentType,
      coverageRatio:
        saved?.coverageRatio !== undefined ? saved.coverageRatio : base.coverageRatio,
    };
    return acc;
  }, {} as PositionCoverageState);
}
