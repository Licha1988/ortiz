import {
  DEFAULT_OPERATIONAL_MONTH_KEY,
  OPERATIONAL_MONTH_KEYS,
  type OperationalMonthKey,
} from "@/lib/operational-year/catalog";
import type { DayActuals, MonthActuals } from "@/lib/operational-year/actuals";
import { emptyMonthActuals } from "@/lib/operational-year/actuals";
import { cloneDashboardParams, mergeMonthParams } from "@/lib/operational-year/mergeMonthParams";
import type { OperationalYearState } from "@/lib/operational-year/types";
import { DEFAULT_PARAMS } from "@/lib/defaults";
import type { PayrollEntry } from "@/lib/payroll/types";
import {
  cloneDefaultPayrollEntries,
  getDefaultNetSalaryForStaffRole,
} from "@/lib/staffing/payroll-bridge";
import { getPositionForStaffRole, getPositionForPayrollRole } from "@/lib/staffing/positions";
import { createDefaultManagerTeam } from "@/lib/staffing/defaults";
import {
  DEFAULT_POSITION_COVERAGE,
  mergePositionCoverage,
} from "@/lib/staffing/position-coverage";
import { DEFAULT_STAFFING_PARAMS } from "@/lib/staffing/params";
import { mergeStaffingParams } from "@/lib/staffing/mergeStaffingParams";
import { mergeEventualDailyHires, type EventualDailyHire } from "@/lib/staffing/eventual-daily";
import type { StaffMember } from "@/lib/staffing/types";
import type { StaffingParams } from "@/lib/staffing/params";
import type { DashboardParams } from "@/lib/types";
import type { PositionCoverageState } from "@/lib/staffing/position-coverage";
import type { Dispatch, SetStateAction } from "react";

export const OPERATIONAL_YEAR_STORAGE_KEY = "ortiz-operational-year-v8";
const LEGACY_STORAGE_KEYS = [
  "ortiz-operational-year-v7",
  "ortiz-operational-year-v6",
  "ortiz-operational-year-v5",
  "ortiz-operational-year-v3",
  "ortiz-operational-year-v2",
  "ortiz-operational-year-v1",
];

function createDefaultManagerTeamWithSalaries(): StaffMember[] {
  return createDefaultManagerTeam().map((member) => ({
    ...member,
    netSalary: getDefaultNetSalaryForStaffRole(member.roleType),
  }));
}

export function createDefaultOperationalYearState(): OperationalYearState {
  const months = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = cloneDashboardParams(DEFAULT_PARAMS);
      return acc;
    },
    {} as OperationalYearState["months"],
  );

  const actuals = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = emptyMonthActuals();
      return acc;
    },
    {} as OperationalYearState["actuals"],
  );

  const payroll = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = cloneDefaultPayrollEntries();
      return acc;
    },
    {} as OperationalYearState["payroll"],
  );

  const managerTeam = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = createDefaultManagerTeamWithSalaries();
      return acc;
    },
    {} as OperationalYearState["managerTeam"],
  );

  const positionCoverage = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = { ...DEFAULT_POSITION_COVERAGE };
      return acc;
    },
    {} as OperationalYearState["positionCoverage"],
  );

  const staffingParams = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = { ...DEFAULT_STAFFING_PARAMS };
      return acc;
    },
    {} as OperationalYearState["staffingParams"],
  );

  const eventualDailyHiring = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = [];
      return acc;
    },
    {} as OperationalYearState["eventualDailyHiring"],
  );

  return {
    activeMonthKey: DEFAULT_OPERATIONAL_MONTH_KEY,
    months,
    actuals,
    payroll,
    managerTeam,
    positionCoverage,
    staffingParams,
    eventualDailyHiring,
  };
}

export function mergeOperationalYearState(stored: Partial<OperationalYearState>): OperationalYearState {
  const defaults = createDefaultOperationalYearState();
  const activeMonthKey = isOperationalMonthKey(stored.activeMonthKey)
    ? stored.activeMonthKey
    : defaults.activeMonthKey;

  const months = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergeMonthParams(stored.months?.[key]);
      return acc;
    },
    {} as OperationalYearState["months"],
  );

  const actuals = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergeMonthActuals(stored.actuals?.[key]);
      return acc;
    },
    {} as OperationalYearState["actuals"],
  );

  const payroll = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergePayrollEntries(stored.payroll?.[key]);
      return acc;
    },
    {} as OperationalYearState["payroll"],
  );

  const managerTeam = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergeManagerTeam(stored.managerTeam?.[key]);
      return acc;
    },
    {} as OperationalYearState["managerTeam"],
  );

  const positionCoverage = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergePositionCoverage(stored.positionCoverage?.[key]);
      return acc;
    },
    {} as OperationalYearState["positionCoverage"],
  );

  const staffingParams = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergeStaffingParams(stored.staffingParams?.[key]);
      return acc;
    },
    {} as OperationalYearState["staffingParams"],
  );

  const eventualDailyHiring = OPERATIONAL_MONTH_KEYS.reduce(
    (acc, key) => {
      acc[key] = mergeEventualDailyHires(stored.eventualDailyHiring?.[key]);
      return acc;
    },
    {} as OperationalYearState["eventualDailyHiring"],
  );

  return {
    activeMonthKey,
    months,
    actuals,
    payroll,
    managerTeam,
    positionCoverage,
    staffingParams,
    eventualDailyHiring,
  };
}

export function readOperationalYearFromStorage(): Partial<OperationalYearState> | null {
  if (typeof window === "undefined") return null;

  try {
    for (const key of [OPERATIONAL_YEAR_STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as Partial<OperationalYearState>;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function mergeMonthActuals(stored?: MonthActuals): MonthActuals {
  if (!stored || typeof stored !== "object") {
    return emptyMonthActuals();
  }

  return Object.entries(stored).reduce((acc, [date, value]) => {
    if (!value || typeof value !== "object") return acc;

    const covers = typeof value.covers === "number" && value.covers >= 0 ? value.covers : undefined;
    const revenue =
      typeof value.revenue === "number" && value.revenue >= 0 ? value.revenue : undefined;

    if (covers === undefined && revenue === undefined) {
      return acc;
    }

    acc[date] = { covers, revenue };
    return acc;
  }, {} as MonthActuals);
}

function mergePayrollEntries(stored?: PayrollEntry[]): PayrollEntry[] {
  const defaults = cloneDefaultPayrollEntries();
  if (!Array.isArray(stored) || stored.length === 0) {
    return defaults;
  }

  const byId = new Map(defaults.map((entry) => [entry.roleId, entry]));
  for (const entry of stored) {
    if (!entry || typeof entry.roleId !== "string") continue;
    const base = byId.get(entry.roleId);
    if (!base) continue;
    byId.set(entry.roleId, {
      ...base,
      ...entry,
      roleId: entry.roleId,
      position: entry.position ?? base.position ?? getPositionForPayrollRole(entry.roleId),
      ccssRate:
        typeof entry.ccssRate === "number"
          ? entry.ccssRate
          : (base.ccssRate ?? (entry.hasCCSS ?? base.hasCCSS ? 0.34 : 0)),
    });
  }

  return defaults.map((entry) => byId.get(entry.roleId) ?? entry);
}

function mergeManagerTeam(stored?: StaffMember[]): StaffMember[] {
  const defaults = createDefaultManagerTeamWithSalaries();
  if (!Array.isArray(stored) || stored.length === 0) {
    return defaults;
  }

  const merged: StaffMember[] = [];
  for (const member of stored) {
    if (!member || typeof member.id !== "string" || typeof member.roleType !== "string") {
      continue;
    }
    merged.push({
      ...member,
      position: member.position ?? getPositionForStaffRole(member.roleType),
      netSalary:
        typeof member.netSalary === "number" && member.netSalary >= 0
          ? member.netSalary
          : getDefaultNetSalaryForStaffRole(member.roleType),
    });
  }

  return merged.length > 0 ? merged : defaults;
}

function isOperationalMonthKey(value: unknown): value is OperationalMonthKey {
  return typeof value === "string" && OPERATIONAL_MONTH_KEYS.includes(value as OperationalMonthKey);
}

export type OperationalYearActions = {
  setActiveMonthKey: (key: OperationalMonthKey) => void;
  setActiveMonthParams: Dispatch<SetStateAction<DashboardParams>>;
  setMonthParams: (key: OperationalMonthKey, updater: SetStateAction<DashboardParams>) => void;
  setDayActual: (date: number, patch: Partial<DayActuals>) => void;
  setActiveMonthPayrollEntries: Dispatch<SetStateAction<PayrollEntry[]>>;
  setActiveMonthManagerTeam: Dispatch<SetStateAction<StaffMember[]>>;
  setActiveMonthPositionCoverage: Dispatch<SetStateAction<PositionCoverageState>>;
  setActiveMonthStaffingParams: Dispatch<SetStateAction<StaffingParams>>;
  setActiveMonthEventualDailyHiring: Dispatch<SetStateAction<EventualDailyHire[]>>;
  resetMonthParams: (key: OperationalMonthKey) => void;
  resetAllMonths: () => void;
};
