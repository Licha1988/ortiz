"use client";

import { useCallback, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import OperationalHub from "@/components/OperationalHub";
import CashflowDashboard from "@/components/CashflowDashboard";
import type { AppView } from "@/lib/app-view";
import { calculateDashboard } from "@/lib/calculations";
import { DEFAULT_CASHFLOW_PARAMS } from "@/lib/cashflow";
import { downloadReport } from "@/lib/export-html";
import { getOperationalMonthEntry } from "@/lib/operational-year/catalog";
import {
  OperationalYearProvider,
  useOperationalYear,
} from "@/lib/operational-year/OperationalYearProvider";
import { computeHrOperationalSummary } from "@/lib/staffing/hr-summary";

function CasaOrtizAppContent() {
  const [activeView, setActiveView] = useState<AppView>("operational");
  const {
    activeMonthParams,
    setActiveMonthParams,
    activeMonthKey,
    activeMonthPayrollEntries,
    setActiveMonthPayrollEntries,
    activeMonthManagerTeam,
    setActiveMonthManagerTeam,
    activeMonthStaffingParams,
    setActiveMonthStaffingParams,
    activeMonthEventualDailyHiring,
  } = useOperationalYear();
  const calendar = getOperationalMonthEntry(activeMonthKey);
  const [cashflowParams, setCashflowParams] = useState(DEFAULT_CASHFLOW_PARAMS);

  const dashboardResults = useMemo(
    () =>
      calculateDashboard(activeMonthParams, {
        year: calendar.year,
        month: calendar.month,
      }),
    [activeMonthParams, calendar.year, calendar.month],
  );
  const monthlyRevenue = dashboardResults.monthlyRevenue;

  const payrollSummary = useMemo(
    () =>
      computeHrOperationalSummary(
        activeMonthManagerTeam,
        activeMonthPayrollEntries,
        monthlyRevenue,
        activeMonthEventualDailyHiring,
      ),
    [
      activeMonthManagerTeam,
      activeMonthPayrollEntries,
      monthlyRevenue,
      activeMonthEventualDailyHiring,
    ],
  );

  const handleExport = useCallback(() => {
    downloadReport(
      activeMonthParams.monthlyCovers,
      dashboardResults,
      payrollSummary,
      activeMonthManagerTeam,
    );
  }, [
    activeMonthParams.monthlyCovers,
    dashboardResults,
    payrollSummary,
    activeMonthManagerTeam,
  ]);

  const content = useMemo(() => {
    if (activeView === "cashflow") {
      return (
        <CashflowDashboard
          cashflowParams={cashflowParams}
          setCashflowParams={setCashflowParams}
        />
      );
    }
    return (
      <OperationalHub
        params={activeMonthParams}
        setParams={setActiveMonthParams}
        monthlyRevenue={monthlyRevenue}
        payrollEntries={activeMonthPayrollEntries}
        setPayrollEntries={setActiveMonthPayrollEntries}
        staffingParams={activeMonthStaffingParams}
        setStaffingParams={setActiveMonthStaffingParams}
        managerTeam={activeMonthManagerTeam}
        setManagerTeam={setActiveMonthManagerTeam}
      />
    );
  }, [
    activeView,
    activeMonthParams,
    setActiveMonthParams,
    activeMonthStaffingParams,
    setActiveMonthStaffingParams,
    activeMonthPayrollEntries,
    setActiveMonthPayrollEntries,
    monthlyRevenue,
    activeMonthManagerTeam,
    setActiveMonthManagerTeam,
    cashflowParams,
  ]);

  return (
    <div className="min-h-full bg-stone-100">
      <AppHeader activeView={activeView} onViewChange={setActiveView} onExport={handleExport} />
      {content}
    </div>
  );
}

export default function CasaOrtizApp() {
  return (
    <OperationalYearProvider>
      <CasaOrtizAppContent />
    </OperationalYearProvider>
  );
}
