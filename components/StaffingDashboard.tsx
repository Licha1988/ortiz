"use client";

import { useMemo, useRef } from "react";
import EventualDailyHiringTable from "@/components/EventualDailyHiringTable";
import HrOperationalKpis from "@/components/HrOperationalKpis";
import MaturityMatrix from "@/components/MaturityMatrix";
import PositionCoverageTable from "@/components/PositionCoverageTable";
import StaffingParamsEditor from "@/components/StaffingParamsEditor";
import RushWindowsTable from "@/components/RushWindowsTable";
import StaffRosterTable from "@/components/StaffRosterTable";
import WeekdayCoversTable from "@/components/WeekdayCoversTable";
import { calculateDashboard } from "@/lib/calculations";
import { getOperationalMonthEntry } from "@/lib/operational-year/catalog";
import { useOperationalYear } from "@/lib/operational-year/OperationalYearProvider";
import type { PayrollEntry } from "@/lib/payroll/types";
import { setPositionEmploymentType } from "@/lib/staffing/position-payroll";
import { resolveMemberPosition } from "@/lib/staffing/payroll-bridge";
import {
  getStaffingMaturity,
} from "@/lib/staffing/calculations";
import { computeHrOperationalSummary } from "@/lib/staffing/hr-summary";
import {
  getPeakDayCovers,
  listPositionCoverageProfiles,
  updatePositionCoverageEmploymentType,
  updatePositionCoverageRatio,
} from "@/lib/staffing/position-coverage";
import type { StaffingParamKey, StaffingParams } from "@/lib/staffing/params";
import {
  STAFF_POSITION_OPTIONS,
  positionNeedsShift,
  positionUsesIndexShiftParity,
  type StaffEmploymentType,
  type StaffPosition,
} from "@/lib/staffing/positions";
import {
  createStaffMemberForPosition,
  moveFrancoDay,
  replaceMemberPosition,
  withUpdatedSchedule,
} from "@/lib/staffing/schedules";
import type { StaffMember } from "@/lib/staffing/types";
import type { DashboardParams } from "@/lib/types";
import type { Day } from "@/lib/types";

type StaffingDashboardProps = {
  params: DashboardParams;
  setParams: React.Dispatch<React.SetStateAction<DashboardParams>>;
  monthlyRevenue: number;
  staffingParams: StaffingParams;
  setStaffingParams: React.Dispatch<React.SetStateAction<StaffingParams>>;
  payrollEntries: PayrollEntry[];
  setPayrollEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
  managerTeam: StaffMember[];
  setManagerTeam: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  embedded?: boolean;
};

export default function StaffingDashboard({
  params,
  setParams,
  monthlyRevenue,
  staffingParams,
  setStaffingParams,
  payrollEntries,
  setPayrollEntries,
  managerTeam,
  setManagerTeam,
  embedded = false,
}: StaffingDashboardProps) {
  const {
    activeMonthKey,
    activeMonthPositionCoverage,
    setActiveMonthPositionCoverage,
    activeMonthEventualDailyHiring,
    setActiveMonthEventualDailyHiring,
  } = useOperationalYear();
  const addPositionRef = useRef<HTMLSelectElement>(null);
  const addShiftRef = useRef<HTMLSelectElement>(null);
  const calendar = getOperationalMonthEntry(activeMonthKey);

  const results = useMemo(
    () =>
      calculateDashboard(params, { year: calendar.year, month: calendar.month }),
    [params, calendar.year, calendar.month],
  );

  const peakDayCovers = useMemo(() => getPeakDayCovers(results), [results]);

  const coverageProfiles = useMemo(
    () => listPositionCoverageProfiles(activeMonthPositionCoverage),
    [activeMonthPositionCoverage],
  );

  const maturity = useMemo(
    () => getStaffingMaturity(params.monthlyCovers),
    [params.monthlyCovers],
  );

  const hrSummary = useMemo(
    () =>
      computeHrOperationalSummary(
        managerTeam,
        payrollEntries,
        monthlyRevenue,
        activeMonthEventualDailyHiring,
      ),
    [
      managerTeam,
      payrollEntries,
      monthlyRevenue,
      activeMonthEventualDailyHiring,
    ],
  );

  function updateMonthlyCovers(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setParams((prev) => ({ ...prev, monthlyCovers: parsed }));
  }

  function updateName(id: string, name: string) {
    setManagerTeam((prev) =>
      prev.map((member) => (member.id === id ? { ...member, name } : member)),
    );
  }

  function updatePosition(id: string, position: StaffPosition) {
    setManagerTeam((prev) =>
      prev.map((member) =>
        member.id === id ? replaceMemberPosition(member, position) : member,
      ),
    );
  }

  function updateSchedule(id: string, day: Day, value: string) {
    setManagerTeam((prev) =>
      prev.map((member) =>
        member.id === id ? withUpdatedSchedule(member, day, value) : member,
      ),
    );
  }

  function moveFranco(id: string, fromDay: Day, toDay: Day) {
    setManagerTeam((prev) =>
      prev.map((member) =>
        member.id === id ? moveFrancoDay(member, fromDay, toDay) : member,
      ),
    );
  }

  function openAddPosition(shift: "am" | "pm") {
    if (addShiftRef.current) {
      addShiftRef.current.value = shift;
    }
    const select = addPositionRef.current;
    if (!select) return;
    select.scrollIntoView({ behavior: "smooth", block: "nearest" });
    select.focus();
    if (typeof select.showPicker === "function") {
      try {
        select.showPicker();
        return;
      } catch {
        // Algunos navegadores exigen el gesto directo; probamos click.
      }
    }
    select.click();
  }

  function removeMember(id: string) {
    setManagerTeam((prev) => prev.filter((member) => member.id !== id));
  }

  function addMember(position: StaffPosition, shift: "am" | "pm") {
    let index = managerTeam.filter(
      (member) => resolveMemberPosition(member) === position,
    ).length;
    if (positionUsesIndexShiftParity(position)) {
      const wantsAm = shift === "am";
      while (index % 2 !== (wantsAm ? 0 : 1)) index += 1;
    }
    setManagerTeam((prev) => [
      ...prev,
      createStaffMemberForPosition(position, shift, index),
    ]);
  }

  function updateStaffingParam(key: StaffingParamKey, value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setStaffingParams((prev) => ({ ...prev, [key]: parsed }));
  }

  function updateCoverageEmploymentType(position: StaffPosition, value: StaffEmploymentType) {
    setActiveMonthPositionCoverage((prev) =>
      updatePositionCoverageEmploymentType(prev, position, value),
    );
    setPayrollEntries((prev) => setPositionEmploymentType(prev, position, value));
  }

  function updateCoverageRatio(position: StaffPosition, value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setActiveMonthPositionCoverage((prev) =>
      updatePositionCoverageRatio(prev, position, parsed),
    );
  }

  const body = (
    <div className="space-y-8">
      <HrOperationalKpis
        params={params}
        monthlyRevenue={monthlyRevenue}
        summary={hrSummary}
        onMonthlyCoversChange={updateMonthlyCovers}
      />

      <StaffingParamsEditor params={staffingParams} onChange={updateStaffingParam} />

      <PositionCoverageTable
        peakDayCovers={peakDayCovers}
        profiles={coverageProfiles}
        onEmploymentTypeChange={updateCoverageEmploymentType}
        onCoverageRatioChange={updateCoverageRatio}
      />

      <MaturityMatrix
        monthlyCovers={params.monthlyCovers}
        maturityLevel={maturity.level}
        payrollEntries={payrollEntries}
        setPayrollEntries={setPayrollEntries}
      />

      <RushWindowsTable
        params={staffingParams}
        results={results}
        onChange={updateStaffingParam}
      />

      <WeekdayCoversTable results={results} />

      <StaffRosterTable
        title="Mi equipo — Plantilla del gerente"
        subtitle="Editá nombres, puestos y horarios · Los sueldos vienen de la estructura de puestos"
        members={managerTeam}
        payrollEntries={payrollEntries}
        editable
        splitByShift
        showPayrollColumns
        onNameChange={updateName}
        onPositionChange={updatePosition}
        onScheduleChange={updateSchedule}
        onMoveFranco={moveFranco}
        onRemove={removeMember}
        onEmptyShiftAction={openAddPosition}
        headerToolbar={
          <>
            <label className="text-xs text-slate-300" htmlFor="add-position">
              Agregar puesto:
            </label>
            <select
              id="add-position"
              ref={addPositionRef}
              defaultValue=""
              onChange={(e) => {
                const position = e.target.value as StaffPosition;
                if (!position) return;
                const shiftSelect = document.getElementById("add-shift") as HTMLSelectElement | null;
                const shift = (shiftSelect?.value as "am" | "pm" | "") || "am";
                addMember(position, positionNeedsShift(position) ? shift : "am");
                e.target.value = "";
              }}
              className="rounded border border-slate-500 bg-white px-2 py-1 text-xs text-stone-800"
            >
              <option value="" disabled>
                Seleccionar puesto
              </option>
              {STAFF_POSITION_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              id="add-shift"
              ref={addShiftRef}
              defaultValue="am"
              className="rounded border border-slate-500 bg-white px-2 py-1 text-xs text-stone-800"
            >
              <option value="am">AM</option>
              <option value="pm">PM</option>
            </select>
          </>
        }
        footer={
          <span>
            <strong>Total plantilla mensual:</strong> {managerTeam.length} personas · Los
            eventuales diarios se cargan abajo
          </span>
        }
      />

      <EventualDailyHiringTable
        results={results}
        payrollEntries={payrollEntries}
        hires={activeMonthEventualDailyHiring}
        onChange={setActiveMonthEventualDailyHiring}
      />
    </div>
  );

  if (embedded) {
    return <div className="space-y-8 px-6 py-6">{body}</div>;
  }

  return body;
}

