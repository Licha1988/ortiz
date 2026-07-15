"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DayActuals, MonthActuals } from "@/lib/operational-year/actuals";
import { setDayActual as mergeDayActual } from "@/lib/operational-year/actuals";
import type { OperationalMonthKey } from "@/lib/operational-year/catalog";
import {
  createDefaultOperationalYearState,
  mergeOperationalYearState,
  OPERATIONAL_YEAR_STORAGE_KEY,
  readOperationalYearFromStorage,
  type OperationalYearActions,
} from "@/lib/operational-year/store";
import type { OperationalYearState } from "@/lib/operational-year/types";
import { cloneDashboardParams } from "@/lib/operational-year/mergeMonthParams";
import { DEFAULT_PARAMS } from "@/lib/defaults";
import type { PayrollEntry } from "@/lib/payroll/types";
import type { PositionCoverageState } from "@/lib/staffing/position-coverage";
import type { StaffingParams } from "@/lib/staffing/params";
import type { EventualDailyHire } from "@/lib/staffing/eventual-daily";
import type { StaffMember } from "@/lib/staffing/types";
import type { DashboardParams } from "@/lib/types";

type OperationalYearContextValue = OperationalYearState &
  OperationalYearActions & {
    activeMonthParams: DashboardParams;
    activeMonthActuals: MonthActuals;
    activeMonthPayrollEntries: PayrollEntry[];
    activeMonthManagerTeam: StaffMember[];
    activeMonthPositionCoverage: PositionCoverageState;
    activeMonthStaffingParams: StaffingParams;
    activeMonthEventualDailyHiring: EventualDailyHire[];
  };

const OperationalYearContext = createContext<OperationalYearContextValue | null>(null);

export function OperationalYearProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OperationalYearState>(createDefaultOperationalYearState);
  /**
   * Evita que el primer render (con valores por defecto) se guarde en
   * localStorage antes de que termine de leerse lo que ya estaba guardado.
   * Sin esto, un remount rápido (p. ej. Fast Refresh en desarrollo) puede
   * pisar datos guardados con los valores por defecto.
   */
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const stored = readOperationalYearFromStorage();
    if (stored) {
      setState(mergeOperationalYearState(stored));
    }
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    window.localStorage.setItem(OPERATIONAL_YEAR_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setActiveMonthKey = useCallback((key: OperationalMonthKey) => {
    setState((prev) => ({ ...prev, activeMonthKey: key }));
  }, []);

  const setMonthParams = useCallback(
    (key: OperationalMonthKey, updater: React.SetStateAction<DashboardParams>) => {
      setState((prev) => {
        const current = prev.months[key];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          months: { ...prev.months, [key]: next },
        };
      });
    },
    [],
  );

  const setActiveMonthParams = useCallback(
    (updater: React.SetStateAction<DashboardParams>) => {
      setState((prev) => {
        const current = prev.months[prev.activeMonthKey];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          months: { ...prev.months, [prev.activeMonthKey]: next },
        };
      });
    },
    [],
  );

  const setDayActual = useCallback((date: number, patch: Partial<DayActuals>) => {
    setState((prev) => {
      const key = prev.activeMonthKey;
      const current = prev.actuals[key] ?? {};
      return {
        ...prev,
        actuals: {
          ...prev.actuals,
          [key]: mergeDayActual(current, date, patch),
        },
      };
    });
  }, []);

  const setActiveMonthPayrollEntries = useCallback(
    (updater: React.SetStateAction<PayrollEntry[]>) => {
      setState((prev) => {
        const key = prev.activeMonthKey;
        const current = prev.payroll[key];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          payroll: { ...prev.payroll, [key]: next },
        };
      });
    },
    [],
  );

  const setActiveMonthManagerTeam = useCallback(
    (updater: React.SetStateAction<StaffMember[]>) => {
      setState((prev) => {
        const key = prev.activeMonthKey;
        const current = prev.managerTeam[key];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          managerTeam: { ...prev.managerTeam, [key]: next },
        };
      });
    },
    [],
  );

  const setActiveMonthPositionCoverage = useCallback(
    (updater: React.SetStateAction<PositionCoverageState>) => {
      setState((prev) => {
        const key = prev.activeMonthKey;
        const current = prev.positionCoverage[key];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          positionCoverage: { ...prev.positionCoverage, [key]: next },
        };
      });
    },
    [],
  );

  const setActiveMonthStaffingParams = useCallback(
    (updater: React.SetStateAction<StaffingParams>) => {
      setState((prev) => {
        const key = prev.activeMonthKey;
        const current = prev.staffingParams[key];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          staffingParams: { ...prev.staffingParams, [key]: next },
        };
      });
    },
    [],
  );

  const setActiveMonthEventualDailyHiring = useCallback(
    (updater: React.SetStateAction<EventualDailyHire[]>) => {
      setState((prev) => {
        const key = prev.activeMonthKey;
        const current = prev.eventualDailyHiring[key];
        const next = typeof updater === "function" ? updater(current) : updater;
        return {
          ...prev,
          eventualDailyHiring: { ...prev.eventualDailyHiring, [key]: next },
        };
      });
    },
    [],
  );

  const resetMonthParams = useCallback((key: OperationalMonthKey) => {
    setMonthParams(key, cloneDashboardParams(DEFAULT_PARAMS));
  }, [setMonthParams]);

  const resetAllMonths = useCallback(() => {
    setState(createDefaultOperationalYearState());
  }, []);

  const value = useMemo<OperationalYearContextValue>(
    () => ({
      ...state,
      activeMonthParams: state.months[state.activeMonthKey],
      activeMonthActuals: state.actuals[state.activeMonthKey] ?? {},
      activeMonthPayrollEntries: state.payroll[state.activeMonthKey],
      activeMonthManagerTeam: state.managerTeam[state.activeMonthKey],
      activeMonthPositionCoverage: state.positionCoverage[state.activeMonthKey],
      activeMonthStaffingParams: state.staffingParams[state.activeMonthKey],
      activeMonthEventualDailyHiring: state.eventualDailyHiring[state.activeMonthKey],
      setActiveMonthKey,
      setActiveMonthParams,
      setMonthParams,
      setDayActual,
      setActiveMonthPayrollEntries,
      setActiveMonthManagerTeam,
      setActiveMonthPositionCoverage,
      setActiveMonthStaffingParams,
      setActiveMonthEventualDailyHiring,
      resetMonthParams,
      resetAllMonths,
    }),
    [
      state,
      setActiveMonthKey,
      setActiveMonthParams,
      setMonthParams,
      setDayActual,
      setActiveMonthPayrollEntries,
      setActiveMonthManagerTeam,
      setActiveMonthPositionCoverage,
      setActiveMonthStaffingParams,
      setActiveMonthEventualDailyHiring,
      resetMonthParams,
      resetAllMonths,
    ],
  );

  return (
    <OperationalYearContext.Provider value={value}>{children}</OperationalYearContext.Provider>
  );
}

export function useOperationalYear(): OperationalYearContextValue {
  const context = useContext(OperationalYearContext);
  if (!context) {
    throw new Error("useOperationalYear debe usarse dentro de OperationalYearProvider");
  }
  return context;
}

export { getDayActual } from "@/lib/operational-year/actuals";
