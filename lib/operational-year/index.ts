export {
  DEFAULT_OPERATIONAL_MONTH_KEY,
  getOperationalMonthEntry,
  getOperationalMonthName,
  OPERATIONAL_MONTH_KEYS,
  OPERATIONAL_YEAR_CATALOG,
  type OperationalMonthKey,
} from "@/lib/operational-year/catalog";
export {
  buildMonthCalendarWeeks,
  getMonthCalendarBounds,
  type CalendarDayCell,
  type CalendarWeek,
  type MonthCalendarBounds,
} from "@/lib/operational-year/buildMonthCalendarWeeks";
export { getDayCountsForMonth } from "@/lib/operational-year/getDayCountsForMonth";
export type { DayActuals, MonthActuals } from "@/lib/operational-year/actuals";
export {
  aggregateObjectiveCompliance,
  dayObjectiveCompliance,
  formatCompliance,
  objectiveComplianceTone,
  summarizeMonthProgress,
  summarizeWeekActuals,
  type MonthProgressSummary,
} from "@/lib/operational-year/compliance";
export { cloneDashboardParams, mergeMonthParams } from "@/lib/operational-year/mergeMonthParams";
export {
  createDefaultOperationalYearState,
  mergeOperationalYearState,
  OPERATIONAL_YEAR_STORAGE_KEY,
  type OperationalYearActions,
} from "@/lib/operational-year/store";
export type { OperationalYearMonths, OperationalYearState } from "@/lib/operational-year/types";
export { OperationalYearProvider, useOperationalYear } from "@/lib/operational-year/OperationalYearProvider";
export type { OperationalCalendar } from "@/lib/types";
