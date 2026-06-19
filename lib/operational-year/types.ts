import { createDefaultManagerTeam } from "@/lib/staffing/defaults";
import {
  cloneDefaultPayrollEntries,
  getDefaultNetSalaryForStaffRole,
} from "@/lib/staffing/payroll-bridge";
import type { OperationalMonthKey } from "@/lib/operational-year/catalog";
import type { MonthActuals } from "@/lib/operational-year/actuals";
import type { PayrollEntry } from "@/lib/payroll/types";
import type { StaffMember } from "@/lib/staffing/types";
import type { PositionCoverageState } from "@/lib/staffing/position-coverage";
import type { StaffingParams } from "@/lib/staffing/params";
import type { EventualDailyHire } from "@/lib/staffing/eventual-daily";
import type { DashboardParams } from "@/lib/types";

export type OperationalYearMonths = Record<OperationalMonthKey, DashboardParams>;
export type OperationalYearActuals = Record<OperationalMonthKey, MonthActuals>;
export type OperationalYearPayroll = Record<OperationalMonthKey, PayrollEntry[]>;
export type OperationalYearManagerTeams = Record<OperationalMonthKey, StaffMember[]>;
export type OperationalYearPositionCoverage = Record<OperationalMonthKey, PositionCoverageState>;
export type OperationalYearStaffingParams = Record<OperationalMonthKey, StaffingParams>;
export type OperationalYearEventualDaily = Record<OperationalMonthKey, EventualDailyHire[]>;

export type OperationalYearState = {
  activeMonthKey: OperationalMonthKey;
  months: OperationalYearMonths;
  actuals: OperationalYearActuals;
  payroll: OperationalYearPayroll;
  managerTeam: OperationalYearManagerTeams;
  positionCoverage: OperationalYearPositionCoverage;
  staffingParams: OperationalYearStaffingParams;
  eventualDailyHiring: OperationalYearEventualDaily;
};
