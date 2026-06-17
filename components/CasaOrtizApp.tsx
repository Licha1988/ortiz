"use client";

import { useCallback, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/components/Dashboard";
import PayrollDashboard from "@/components/PayrollDashboard";
import StaffingDashboard from "@/components/StaffingDashboard";
import type { AppView } from "@/lib/app-view";
import { calculateDashboard } from "@/lib/calculations";
import { DEFAULT_PARAMS } from "@/lib/defaults";
import { downloadReport } from "@/lib/export-html";
import { DEFAULT_PAYROLL_ENTRIES } from "@/lib/payroll/data";
import {
  computePayrollSummary,
  staffingToPayrollSuggestions,
} from "@/lib/payroll/calculations";
import type { PayrollEntry } from "@/lib/payroll/types";
import {
  calculateRequiredHeadcount,
  calculateStaffingSummary,
} from "@/lib/staffing/calculations";
import { createDefaultManagerTeam } from "@/lib/staffing/defaults";
import { DEFAULT_STAFFING_PARAMS } from "@/lib/staffing/params";
import type { StaffMember } from "@/lib/staffing/types";
import type { DashboardParams } from "@/lib/types";

function initPayrollEntries(): PayrollEntry[] {
  return DEFAULT_PAYROLL_ENTRIES.map((def) => def);
}

export default function CasaOrtizApp() {
  const [activeView, setActiveView] = useState<AppView>("operational");
  const [params, setParams] = useState<DashboardParams>(DEFAULT_PARAMS);
  const [staffingParams, setStaffingParams] = useState(DEFAULT_STAFFING_PARAMS);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>(initPayrollEntries);
  const [managerTeam, setManagerTeam] = useState<StaffMember[]>(createDefaultManagerTeam);

  const dashboardResults = useMemo(() => calculateDashboard(params), [params]);
  const monthlyRevenue = dashboardResults.monthlyRevenue;

  const requiredCounts = useMemo(
    () => calculateRequiredHeadcount(dashboardResults, staffingParams),
    [dashboardResults, staffingParams],
  );

  const staffingSummary = useMemo(
    () => calculateStaffingSummary(dashboardResults, params.monthlyCovers, managerTeam, staffingParams),
    [dashboardResults, params.monthlyCovers, managerTeam, staffingParams],
  );

  const payrollSummary = useMemo(() => {
    const suggestions = staffingToPayrollSuggestions(requiredCounts);
    return computePayrollSummary(payrollEntries, suggestions, monthlyRevenue);
  }, [payrollEntries, requiredCounts, monthlyRevenue]);

  const handleExport = useCallback(() => {
    downloadReport(
      params.monthlyCovers,
      dashboardResults,
      payrollSummary,
      staffingSummary.suggestedTeam,
    );
  }, [params.monthlyCovers, dashboardResults, payrollSummary, staffingSummary.suggestedTeam]);

  const content = useMemo(() => {
    if (activeView === "staffing") {
      return (
        <StaffingDashboard
          params={params}
          setParams={setParams}
          staffingParams={staffingParams}
          setStaffingParams={setStaffingParams}
          managerTeam={managerTeam}
          setManagerTeam={setManagerTeam}
        />
      );
    }
    if (activeView === "payroll") {
      return (
        <PayrollDashboard
          params={params}
          setParams={setParams}
          monthlyRevenue={monthlyRevenue}
          entries={payrollEntries}
          setEntries={setPayrollEntries}
          requiredCounts={requiredCounts}
        />
      );
    }
    return <Dashboard params={params} setParams={setParams} />;
  }, [activeView, params, staffingParams, payrollEntries, monthlyRevenue, managerTeam]);

  return (
    <div className="min-h-full bg-stone-100">
      <AppHeader activeView={activeView} onViewChange={setActiveView} onExport={handleExport} />
      {content}
    </div>
  );
}
