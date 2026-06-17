"use client";

import { useEffect, useMemo, useState } from "react";
import MaturityMatrix from "@/components/MaturityMatrix";
import StaffRosterTable from "@/components/StaffRosterTable";
import StaffingParamsEditor from "@/components/StaffingParamsEditor";
import { calculateDashboard } from "@/lib/calculations";
import { capitalizeSlot, formatCovers, formatNumber } from "@/lib/format";
import {
  calculateStaffingSummary,
} from "@/lib/staffing/calculations";
import type { StaffingParamKey, StaffingParams } from "@/lib/staffing/params";
import { createStaffMember, withUpdatedSchedule } from "@/lib/staffing/schedules";
import type { StaffMember, StaffRoleType } from "@/lib/staffing/types";
import type { DashboardParams } from "@/lib/types";
import type { Day } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";
import WeeklyMatrixTable from "@/components/WeeklyMatrixTable";

type CollapsibleKey =
  | "required"
  | "actions"
  | "managerTeam"
  | "params"
  | "rush"
  | "demand";

const COLLAPSIBLE_DEFAULTS: Record<CollapsibleKey, boolean> = {
  required: true,
  actions: true,
  managerTeam: true,
  params: false,
  rush: false,
  demand: false,
};

const COLLAPSIBLE_STORAGE_KEY = "casa-ortiz:staffing-collapsible";

const ADD_ROLE_OPTIONS: Array<{
  label: string;
  roleType: StaffRoleType;
  shift?: "am" | "pm";
}> = [
  { label: "Lisandro (Dirección operativa)", roleType: "LIS" },
  { label: "Bruno Bonnano (Chef ejecutivo)", roleType: "BRUNO" },
  { label: "Gerente", roleType: "GER" },
  { label: "Encargado AM", roleType: "ENC" },
  { label: "Cajero AM", roleType: "CAJ_AM" },
  { label: "Jefe de Salón AM", roleType: "JFS_AM" },
  { label: "Camarero AM", roleType: "CAM", shift: "am" },
  { label: "Comis / Eventual AM", roleType: "CE", shift: "am" },
  { label: "Barra / Café AM", roleType: "BC", shift: "am" },
  { label: "Camarero AM", roleType: "CR" },
  { label: "Responsable de producción AM", roleType: "PAR_AM" },
  { label: "Jefe de cocina AM", roleType: "JEFE_COC_AM" },
  { label: "Cocinero AM", roleType: "FUE_AM" },
  { label: "Cajero PM", roleType: "CAJ_PM" },
  { label: "Jefe de Salón PM", roleType: "JFS_PM" },
  { label: "Recepcionista PM", roleType: "REC_PM" },
  { label: "Camarero PM", roleType: "CAM", shift: "pm" },
  { label: "Comis / Eventual PM", roleType: "CE", shift: "pm" },
  { label: "Barra / Café PM", roleType: "BC", shift: "pm" },
  { label: "Jefe de cocina PM", roleType: "JEFE_COC_PM" },
  { label: "Ayudante cocina PM — Parrilla", roleType: "PAR_PM" },
  { label: "Ayudante cocina PM — Fuegos", roleType: "FUE_PM" },
  { label: "Ayudante cocina PM — Guarniciones", roleType: "GUAR_PM" },
  { label: "Ayudante cocina PM — Freidora", roleType: "FREI_PM" },
  { label: "Bacha PM", roleType: "BACH_PM" },
];

function usePersistentCollapsible() {
  const [open, setOpen] = useState<Record<CollapsibleKey, boolean>>(COLLAPSIBLE_DEFAULTS);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSIBLE_STORAGE_KEY);
      if (stored) {
        setOpen({ ...COLLAPSIBLE_DEFAULTS, ...JSON.parse(stored) });
      }
    } catch {
      setOpen(COLLAPSIBLE_DEFAULTS);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSIBLE_STORAGE_KEY, JSON.stringify(open));
  }, [open]);

  const toggle = (key: CollapsibleKey) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return { open, toggle };
}

function CollapsibleSection({
  id,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  id: CollapsibleKey;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: (key: CollapsibleKey) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-4 bg-slate-800 px-4 py-3 text-left text-white transition hover:bg-slate-700"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-slate-300">{subtitle}</span>}
        </span>
        <span className="text-lg font-bold" aria-hidden="true">
          {open ? "▼" : "▶"}
        </span>
      </button>
      {open && <div className="p-0">{children}</div>}
    </section>
  );
}

function OperationalDemandHeatmap({
  results,
}: {
  results: ReturnType<typeof calculateDashboard>;
}) {
  const maxCovers = Math.max(
    1,
    ...TIME_SLOTS.flatMap((slot) =>
      (Object.values(results.coversMatrix[slot]) as number[]),
    ),
  );

  function heatClass(value: number) {
    const intensity = value / maxCovers;
    if (intensity >= 0.85) return "bg-red-600 text-white";
    if (intensity >= 0.65) return "bg-orange-500 text-white";
    if (intensity >= 0.45) return "bg-amber-300 text-amber-950";
    if (intensity >= 0.25) return "bg-emerald-100 text-emerald-950";
    return "bg-slate-50 text-slate-500";
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          Mapa de calor — exigencia del equipo operativo
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Intensidad relativa por día y franja: cuanto más fuerte el color, mayor presión sobre el equipo.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-700">
                Franja
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border border-slate-200 bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
                  {capitalizeSlot(slot)}
                </td>
                {DAYS.map((day) => {
                  const value = results.coversMatrix[slot][day];
                  const pct = Math.round((value / maxCovers) * 100);
                  return (
                    <td
                      key={day}
                      className={`border border-white px-3 py-2 text-center text-xs font-semibold ${heatClass(value)}`}
                    >
                      <span className="block text-sm">{formatCovers(value)}</span>
                      <span className="text-[10px] opacity-75">{pct}% presión</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
        <span className="rounded bg-slate-50 px-2 py-1">Baja</span>
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-900">Media baja</span>
        <span className="rounded bg-amber-300 px-2 py-1 text-amber-950">Media</span>
        <span className="rounded bg-orange-500 px-2 py-1 text-white">Alta</span>
        <span className="rounded bg-red-600 px-2 py-1 text-white">Muy alta</span>
      </div>
    </div>
  );
}

type StaffingDashboardProps = {
  params: DashboardParams;
  setParams: React.Dispatch<React.SetStateAction<DashboardParams>>;
  staffingParams: StaffingParams;
  setStaffingParams: React.Dispatch<React.SetStateAction<StaffingParams>>;
  managerTeam: StaffMember[];
  setManagerTeam: React.Dispatch<React.SetStateAction<StaffMember[]>>;
};

export default function StaffingDashboard({
  params,
  setParams,
  staffingParams,
  setStaffingParams,
  managerTeam,
  setManagerTeam,
}: StaffingDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { open, toggle } = usePersistentCollapsible();

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const results = useMemo(() => calculateDashboard(params), [params]);

  const summary = useMemo(
    () =>
      calculateStaffingSummary(
        results,
        params.monthlyCovers,
        managerTeam,
        staffingParams,
      ),
    [results, params.monthlyCovers, managerTeam, staffingParams],
  );

  function updateMonthlyCovers(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setParams((prev) => ({ ...prev, monthlyCovers: parsed }));
  }


  function updateStaffingParam(key: StaffingParamKey, value: string) {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setStaffingParams((prev) => ({ ...prev, [key]: parsed }));
  }

  function updateName(id: string, name: string) {
    setManagerTeam((prev) =>
      prev.map((member) => (member.id === id ? { ...member, name } : member)),
    );
  }

  function updateSchedule(id: string, day: Day, value: string) {
    setManagerTeam((prev) =>
      prev.map((member) =>
        member.id === id ? withUpdatedSchedule(member, day, value) : member,
      ),
    );
  }

  function removeMember(id: string) {
    setManagerTeam((prev) => prev.filter((member) => member.id !== id));
  }

  function addMember(roleType: StaffRoleType, shift?: "am" | "pm") {
    const currentCount = managerTeam.filter((m) => m.roleType === roleType).length;
    let index = currentCount;
    if (shift && (roleType === "CAM" || roleType === "CE" || roleType === "BC")) {
      const wantsAm = shift === "am";
      index = currentCount;
      while (index % 2 !== (wantsAm ? 0 : 1)) index += 1;
    }
    setManagerTeam((prev) => [...prev, createStaffMember(roleType, index)]);
  }

  return (
    <main className="mx-auto max-w-[1400px] space-y-8 px-6 py-8">
      <section className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
        <div className="bg-violet-800 px-4 py-3 text-sm font-semibold tracking-wide text-white">
          Driver operativo — cubiertos mensuales proyectados
        </div>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <label className="block">
            <span className="text-sm font-medium text-violet-900">
              Cubiertos mensuales
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={params.monthlyCovers}
              onChange={(e) => updateMonthlyCovers(e.target.value)}
              className="mt-2 w-full max-w-xs rounded-xl border border-violet-300 bg-amber-50 px-4 py-2.5 text-stone-900 outline-none transition focus:border-violet-500 focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/30"
            />
          </label>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs text-violet-700">Semanales</p>
            <p className="text-lg font-semibold text-stone-900">
              {formatNumber(results.weeklyCoversTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs text-violet-700">Plantilla sugerida</p>
            <p className="text-lg font-semibold text-stone-900">
              {summary.requiredTotal} pers.
            </p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs text-violet-700">Nivel</p>
            <p className="text-sm font-semibold text-stone-900">
              {summary.maturityLevel.replace("NIVEL ", "N")}
            </p>
          </div>
        </div>
      </section>

      <MaturityMatrix
        monthlyCovers={params.monthlyCovers}
        maturityLevel={summary.maturityLevel}
        roles={summary.maturityRoles}
        peakDayCovers={summary.peakDayCovers}
        peakMorningCovers={summary.peakMorningCovers}
        peakDiurnoBar={summary.peakDiurnoBar}
        peakVespertinoBar={summary.peakVespertinoBar}
        peakBarNeed={summary.peakBarNeed}
      />

      <CollapsibleSection
        id="params"
        title="Parámetros de operación"
        subtitle="Celdas amarillas: ratios de cobertura y criterios editables"
        open={open.params}
        onToggle={toggle}
      >
        <StaffingParamsEditor
          params={staffingParams}
          onChange={updateStaffingParam}
        />
      </CollapsibleSection>

      {/* ── Rush Hours + Permanencia ──────────────────────────────────── */}
      <CollapsibleSection
        id="rush"
        title="Ventana de rush y permanencia por turno"
        subtitle="Duración del pico y permanencia promedio para dimensionar camareros"
        open={open.rush}
        onToggle={toggle}
      >
      <section className="overflow-hidden bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            El equipo se dimensiona por el pico más alto entre sus franjas — no por la suma.
            Pico simult. = min(cubiertos, cubiertos × % rush ÷ duración_rush × permanencia)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Franja", "Inicio rush", "Fin rush", "Duración", "% en rush", "Permanencia", "Pico simult.", "Cams necesarios"].map((h) => (
                  <th key={h} className="border border-slate-300 bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700 first:text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ── Turno AM ── */}
              {(() => {
                const amSlots = ["desayuno", "almuerzo", "merienda"] as const;
                // Calcular pico y cams por slot para el día más exigente
                const slotData = amSlots.map((slot) => {
                  const startKey = `rush${slot.charAt(0).toUpperCase() + slot.slice(1)}Start` as StaffingParamKey;
                  const endKey   = `rush${slot.charAt(0).toUpperCase() + slot.slice(1)}End`   as StaffingParamKey;
                  const shareKey = `rush${slot.charAt(0).toUpperCase() + slot.slice(1)}Share` as StaffingParamKey;
                  const dwellKey = `dwell${slot.charAt(0).toUpperCase() + slot.slice(1)}`      as StaffingParamKey;
                  const start = staffingParams[startKey] as number;
                  const end   = staffingParams[endKey]   as number;
                  const share = staffingParams[shareKey] as number;
                  const dwell = staffingParams[dwellKey] as number;
                  const dur   = Math.max(0.5, end - start);
                  const maxCov = Math.max(...Object.values(results.coversMatrix[slot]));
                  const rushCovers = maxCov * Math.min(1, Math.max(0, share / 100));
                  const rawPeak = maxCov > 0 ? (rushCovers / dur) * dwell : 0;
                  const peakSim = Math.min(maxCov, rawPeak);
                  const cams    = maxCov > 0 ? Math.ceil(peakSim / staffingParams.waiterRatioDay) : 0;
                  return { slot, startKey, endKey, shareKey, dwellKey, start, end, share, dwell, dur, maxCov, peakSim, cams };
                });
                const teamAM = Math.max(1, ...slotData.map((d) => d.cams));
                const bottleneck = slotData.find((d) => d.cams === teamAM);
                return (
                  <>
                    <tr className="bg-blue-50">
                      <td colSpan={8} className="border border-slate-200 px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className="rounded bg-blue-700 px-2 py-0.5 text-xs font-bold text-white">TURNO AM · 09:00–17:00</span>
                          <span className="text-xs text-slate-600">Desayuno + Almuerzo + Merienda — <strong>mismo equipo</strong></span>
                          <span className="ml-auto text-xs font-semibold text-blue-800">
                            Equipo AM: <span className="rounded bg-blue-700 px-2 py-0.5 text-white">{teamAM} camareros</span>
                            {bottleneck && <span className="ml-1 font-normal text-slate-500">(limitante: {capitalizeSlot(bottleneck.slot)})</span>}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {slotData.map(({ slot, startKey, endKey, shareKey, dwellKey, start, end, share, dwell, dur, maxCov, peakSim, cams }) => {
                      const isBottleneck = cams === teamAM && teamAM > 0;
                      return (
                        <tr key={slot} className={isBottleneck ? "bg-blue-50/60" : "bg-white"}>
                          <td className={`border border-slate-200 px-4 py-2 font-medium ${isBottleneck ? "text-blue-800" : "text-slate-600"}`}>
                            {capitalizeSlot(slot)}
                            {isBottleneck && <span className="ml-1 text-[10px] text-blue-500">← pico</span>}
                          </td>
                          <td className="border border-slate-200 px-3 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" min={0} max={23} step={1} value={start}
                                onChange={(e) => updateStaffingParam(startKey, e.target.value)}
                                className="w-16 rounded border border-slate-300 bg-amber-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                              />
                              <span className="text-xs text-slate-400">h</span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-3 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" min={0} max={24} step={1} value={end}
                                onChange={(e) => updateStaffingParam(endKey, e.target.value)}
                                className="w-16 rounded border border-slate-300 bg-amber-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                              />
                              <span className="text-xs text-slate-400">h</span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-4 py-2 text-center text-slate-600">{dur}h</td>
                          <td className="border border-slate-200 px-3 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" min={0} max={100} step={5} value={share}
                                onChange={(e) => updateStaffingParam(shareKey, e.target.value)}
                                className="w-16 rounded border border-slate-300 bg-amber-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                              />
                              <span className="text-xs text-slate-400">%</span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-3 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input type="number" min={0.25} max={6} step={0.25} value={dwell}
                                onChange={(e) => updateStaffingParam(dwellKey, e.target.value)}
                                className="w-20 rounded border border-slate-300 bg-emerald-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                              />
                              <span className="text-xs text-slate-400">h</span>
                            </div>
                          </td>
                          <td className="border border-slate-200 px-4 py-2 text-center text-slate-600">
                            {maxCov > 0 ? peakSim.toFixed(0) : "—"}
                          </td>
                          <td className={`border border-slate-200 px-4 py-2 text-center font-semibold ${isBottleneck ? "text-blue-700" : "text-slate-400"}`}>
                            {maxCov > 0 ? cams : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })()}

              {/* ── Turno PM ── */}
              {(() => {
                const pmSlots = ["cena"] as const;
                const slotData = pmSlots.map((slot) => {
                  const startKey = `rush${slot.charAt(0).toUpperCase() + slot.slice(1)}Start` as StaffingParamKey;
                  const endKey   = `rush${slot.charAt(0).toUpperCase() + slot.slice(1)}End`   as StaffingParamKey;
                  const shareKey = `rush${slot.charAt(0).toUpperCase() + slot.slice(1)}Share` as StaffingParamKey;
                  const dwellKey = `dwell${slot.charAt(0).toUpperCase() + slot.slice(1)}`      as StaffingParamKey;
                  const start = staffingParams[startKey] as number;
                  const end   = staffingParams[endKey]   as number;
                  const share = staffingParams[shareKey] as number;
                  const dwell = staffingParams[dwellKey] as number;
                  const dur   = Math.max(0.5, end - start);
                  const maxCov = Math.max(...Object.values(results.coversMatrix[slot]));
                  const rushCovers = maxCov * Math.min(1, Math.max(0, share / 100));
                  const rawPeak = maxCov > 0 ? (rushCovers / dur) * dwell : 0;
                  const peakSim = Math.min(maxCov, rawPeak);
                  const cams    = maxCov > 0 ? Math.ceil(peakSim / staffingParams.waiterRatioDinner) : 0;
                  return { slot, startKey, endKey, shareKey, dwellKey, start, end, share, dwell, dur, maxCov, peakSim, cams };
                });
                const teamPM = Math.max(1, ...slotData.map((d) => d.cams));
                return (
                  <>
                    <tr className="bg-indigo-50">
                      <td colSpan={8} className="border border-slate-200 px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className="rounded bg-indigo-700 px-2 py-0.5 text-xs font-bold text-white">TURNO PM · 17:00–cierre</span>
                          <span className="text-xs text-slate-600">Cena — <strong>equipo independiente</strong></span>
                          <span className="ml-auto text-xs font-semibold text-indigo-800">
                            Equipo PM: <span className="rounded bg-indigo-700 px-2 py-0.5 text-white">{teamPM} camareros</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                    {slotData.map(({ slot, startKey, endKey, shareKey, dwellKey, start, end, share, dwell, dur, maxCov, peakSim, cams }) => (
                      <tr key={slot} className="bg-white">
                        <td className="border border-slate-200 px-4 py-2 font-medium text-indigo-800">
                          {capitalizeSlot(slot)}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min={0} max={23} step={1} value={start}
                              onChange={(e) => updateStaffingParam(startKey, e.target.value)}
                              className="w-16 rounded border border-slate-300 bg-amber-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                            />
                            <span className="text-xs text-slate-400">h</span>
                          </div>
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min={0} max={24} step={1} value={end}
                              onChange={(e) => updateStaffingParam(endKey, e.target.value)}
                              className="w-16 rounded border border-slate-300 bg-amber-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                            />
                            <span className="text-xs text-slate-400">h</span>
                          </div>
                        </td>
                        <td className="border border-slate-200 px-4 py-2 text-center text-slate-600">{dur}h</td>
                        <td className="border border-slate-200 px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min={0} max={100} step={5} value={share}
                              onChange={(e) => updateStaffingParam(shareKey, e.target.value)}
                              className="w-16 rounded border border-slate-300 bg-amber-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                            />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min={0.25} max={6} step={0.25} value={dwell}
                              onChange={(e) => updateStaffingParam(dwellKey, e.target.value)}
                              className="w-20 rounded border border-slate-300 bg-emerald-50 px-2 py-1 text-center text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                            />
                            <span className="text-xs text-slate-400">h</span>
                          </div>
                        </td>
                        <td className="border border-slate-200 px-4 py-2 text-center text-slate-600">
                          {maxCov > 0 ? peakSim.toFixed(0) : "—"}
                        </td>
                        <td className="border border-slate-200 px-4 py-2 text-center font-semibold text-indigo-700">
                          {maxCov > 0 ? cams : "—"}
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </section>
      </CollapsibleSection>

      <div className="space-y-8">
        {/* ── Escenario de demanda ─────────────────────────────────────────── */}
        <CollapsibleSection
          id="demand"
          title="Escenario de demanda"
          subtitle="Cubiertos mensuales y matriz semanal de cubiertos"
          open={open.demand}
          onToggle={toggle}
        >
        <section className="overflow-hidden bg-white">
          <div className="border-b border-slate-700 bg-slate-800 px-5 py-3.5">
            <p className="text-sm font-semibold text-white">
              Escenario de demanda — cubiertos mensuales
            </p>
            <p className="mt-0.5 text-xs text-slate-300">
              Cambiá los cubiertos para ver cómo se recalcula el equipo en tiempo real
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cubiertos mensuales
              </p>
              <input
                type="number"
                min={0}
                step={100}
                value={params.monthlyCovers}
                onChange={(e) => updateMonthlyCovers(e.target.value)}
                className="mt-2 w-44 rounded-lg border border-slate-300 bg-amber-50 px-3 py-2 text-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-amber-100 focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{formatCovers(results.weeklyCovers)}</span> cubiertos / semana
            </div>
          </div>

          <div className="border-t border-slate-100 p-5">
            <div className="mb-5">
              <OperationalDemandHeatmap results={results} />
            </div>
            <WeeklyMatrixTable
              title="Cantidad de cubiertos por semana"
              results={results}
              mode="covers"
            />
          </div>
        </section>
        </CollapsibleSection>

        {/* ── Plantilla requerida (full width) ──────────────────────────── */}
        <CollapsibleSection
          id="required"
          title="Plantilla requerida"
          subtitle="Equipo sugerido por turno, ordenado por estructura operativa"
          open={open.required}
          onToggle={toggle}
        >
          <StaffRosterTable
            title="Plantilla de personal requerida"
            subtitle={`Actualizado: ${
              lastUpdated
                ? lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                : "—"
            } · ${formatCovers(params.monthlyCovers)} cub/mes · AM 9:00–17:00 / PM 17:00–cierre`}
            members={summary.suggestedTeam}
            splitByShift
            footer={
              <p>
                <strong>TOTAL:</strong> {summary.requiredTotal} personas requeridas
                {summary.difference > 0 && (
                  <span className="ml-2 text-emerald-700">
                    · Plantilla actual ({summary.currentTotal}) cubre — excedente{" "}
                    {summary.difference}
                  </span>
                )}
                {summary.difference < 0 && (
                  <span className="ml-2 text-amber-700">
                    · Faltan {Math.abs(summary.difference)} personas vs. demanda
                  </span>
                )}
              </p>
            }
          />
        </CollapsibleSection>

        {/* ── Acciones requeridas ────────────────────────────────────────── */}
        <CollapsibleSection
          id="actions"
          title="Acciones requeridas por tipo de personal"
          subtitle="Comparación entre plantilla del gerente y dotación requerida"
          open={open.actions}
          onToggle={toggle}
        >
        <section className="overflow-hidden bg-white">
          <div className="bg-slate-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-white">
              Acciones requeridas por tipo de personal
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {summary.actions.map((action, index) => (
              <div
                key={`${action.roleType}-${action.label}-${index}`}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[12rem_1fr]"
              >
                <p className="text-sm font-medium text-slate-800">{action.label}</p>
                <p
                  className={`text-sm ${
                    action.status === "ok"
                      ? "text-emerald-700"
                      : action.status === "excedente"
                        ? "text-sky-700"
                        : "text-amber-700"
                  }`}
                >
                  {action.message}
                </p>
              </div>
            ))}
          </div>
        </section>
        </CollapsibleSection>

        {/* ── Mi equipo (full width, below required) ─────────────────────── */}
        <CollapsibleSection
          id="managerTeam"
          title="Mi equipo — Plantilla del gerente"
          subtitle="Editar nombres, horarios y altas/bajas"
          open={open.managerTeam}
          onToggle={toggle}
        >
          <StaffRosterTable
            title="Mi equipo — Plantilla del gerente"
            subtitle="Editá nombres y horarios · Los francos se marcan en rojo"
            members={managerTeam}
            editable
            splitByShift
            onNameChange={updateName}
            onScheduleChange={updateSchedule}
            onRemove={removeMember}
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <strong>Total plantilla actual:</strong> {managerTeam.length}{" "}
                  personas
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-slate-600" htmlFor="add-role">
                    Agregar puesto:
                  </label>
                  <select
                    id="add-role"
                    defaultValue=""
                    onChange={(e) => {
                      const option = ADD_ROLE_OPTIONS[Number(e.target.value)];
                      if (option) {
                        addMember(option.roleType, option.shift);
                        e.target.value = "";
                      }
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="" disabled>
                      Seleccionar rol
                    </option>
                    {ADD_ROLE_OPTIONS.map((option, index) => (
                      <option key={`${option.roleType}-${option.shift ?? "base"}`} value={index}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            }
          />
        </CollapsibleSection>

      </div>
    </main>
  );
}
