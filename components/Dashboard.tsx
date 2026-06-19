"use client";

import { useMemo } from "react";
import KpiCard from "@/components/ui/KpiCard";
import PageLayout from "@/components/ui/PageLayout";
import SectionCard from "@/components/ui/SectionCard";
import MonthlyCalendarWeeks from "@/components/MonthlyCalendarWeeks";
import TicketMatrixEditor from "@/components/TicketMatrixEditor";
import { calculateDashboard, sumValues } from "@/lib/calculations";
import { LOCAL_CAPACITY } from "@/lib/config";
import {
  capitalizeDay,
  capitalizeSlot,
  formatCovers,
  formatCurrency,
  formatNumber,
  parseCurrency,
} from "@/lib/format";
import {
  getOperationalMonthEntry,
  getOperationalMonthName,
} from "@/lib/operational-year/catalog";
import {
  formatCompliance,
  objectiveComplianceTone,
  summarizeMonthProgress,
} from "@/lib/operational-year/compliance";
import { useOperationalYear } from "@/lib/operational-year/OperationalYearProvider";
import type { DashboardParams } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";

type DashboardProps = {
  params: DashboardParams;
  setParams: React.Dispatch<React.SetStateAction<DashboardParams>>;
  embedded?: boolean;
};

function PercentageBar({ value, total }: { value: number; total: number }) {
  const width = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
      <div
        className="h-full rounded-full bg-amber-700 transition-all duration-300"
        style={{ width: `${Math.min(width, 100)}%` }}
      />
    </div>
  );
}

function SumBadge({ sum, label }: { sum: number; label: string }) {
  const isValid = Math.abs(sum - 100) < 0.01;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isValid
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-900"
      }`}
    >
      {label}: {formatNumber(sum)}%
      {!isValid && " · debe sumar 100%"}
    </span>
  );
}

function ComplianceBadge({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-stone-500">
        —
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${objectiveComplianceTone(value)}`}
    >
      {formatCompliance(value)}
    </span>
  );
}

function ProgressMetricRow({
  label,
  targetLabel,
  targetValue,
  actualValue,
  compliance,
}: {
  label: string;
  targetLabel: string;
  targetValue: string;
  actualValue: string;
  compliance: number | null;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <ComplianceBadge value={compliance} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
            {targetLabel}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-stone-900">{targetValue}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
            Real acumulado
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-violet-900">{actualValue}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ params, setParams, embedded = false }: DashboardProps) {
  const { activeMonthKey, activeMonthActuals } = useOperationalYear();
  const calendar = getOperationalMonthEntry(activeMonthKey);
  const monthName = getOperationalMonthName(calendar.month);
  const results = useMemo(
    () =>
      calculateDashboard(params, { year: calendar.year, month: calendar.month }),
    [params, calendar.year, calendar.month],
  );
  const monthProgress = useMemo(
    () => summarizeMonthProgress(results.calendarDays, activeMonthActuals),
    [results.calendarDays, activeMonthActuals],
  );
  const daySum = sumValues(params.dayPercentages);
  const slotSum = sumValues(params.slotPercentages);

  function updateMonthlyCovers(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setParams((prev) => ({ ...prev, monthlyCovers: parsed }));
  }

  function rotationColor(r: number): string {
    if (r >= 1.0) return "bg-red-100 text-red-800 font-semibold";
    if (r >= 0.75) return "bg-amber-100 text-amber-800 font-semibold";
    if (r >= 0.4) return "bg-sky-100 text-sky-800";
    if (r > 0) return "bg-emerald-50 text-emerald-700";
    return "text-stone-300";
  }

  function updateTicket(
    slot: (typeof TIME_SLOTS)[number],
    day: (typeof DAYS)[number],
    value: string,
  ) {
    const parsed = parseCurrency(value);
    if (parsed === null) return;
    setParams((prev) => ({
      ...prev,
      ticketMatrix: {
        ...prev.ticketMatrix,
        [slot]: { ...prev.ticketMatrix[slot], [day]: parsed },
      },
    }));
  }

  function updateDayPercentage(day: (typeof DAYS)[number], value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setParams((prev) => ({
      ...prev,
      dayPercentages: { ...prev.dayPercentages, [day]: parsed },
    }));
  }

  function updateSlotPercentage(
    slot: (typeof TIME_SLOTS)[number],
    value: string,
  ) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setParams((prev) => ({
      ...prev,
      slotPercentages: { ...prev.slotPercentages, [slot]: parsed },
    }));
  }

  const body = (
    <>
        <SectionCard title="Parámetro base">
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-end gap-6">
              <label className="block min-w-[200px] flex-1">
                <span className="text-sm font-medium text-violet-900">
                  Cubiertos proyectados (base mensual)
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={params.monthlyCovers}
                  onChange={(e) => updateMonthlyCovers(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-violet-300 bg-amber-50 px-4 py-2.5 text-stone-900 outline-none transition focus:border-violet-500 focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/30"
                />
              </label>
              <div className="pb-0.5">
                <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">
                  Capacidad del local
                </p>
                <p className="mt-1 text-2xl font-bold text-stone-900">
                  {LOCAL_CAPACITY}
                  <span className="ml-1 text-sm font-normal text-stone-500">cubiertos</span>
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Objetivos ${monthName}`}>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <KpiCard
              label="Cubiertos"
              value={formatNumber(results.monthlyCoversTotal)}
              hint={`Proyección de ${calendar.label}`}
              tone="violet"
            />
            <KpiCard
              label="Facturación mensual"
              value={formatCurrency(results.monthlyRevenue)}
              hint={`Proyección de ${calendar.label}`}
              tone="violet"
            />
            <KpiCard
              label="Ticket promedio"
              value={formatCurrency(results.weightedAvgTicket)}
              hint="Promedio ponderado del mes"
              tone="violet"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Cumplimiento"
          subtitle={
            monthProgress
              ? `Al día ${monthProgress.progressDay} de ${monthName.toLowerCase()}`
              : "Completá datos reales en el calendario"
          }
        >
          <div className="p-6">
            {monthProgress ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <ProgressMetricRow
                  label="Cubiertos"
                  targetLabel={`Objetivo al día ${monthProgress.progressDay}`}
                  targetValue={formatCovers(monthProgress.targetCovers)}
                  actualValue={formatCovers(monthProgress.actualCovers)}
                  compliance={monthProgress.coversCompliance}
                />
                <ProgressMetricRow
                  label="Facturación"
                  targetLabel={`Objetivo al día ${monthProgress.progressDay}`}
                  targetValue={formatCurrency(monthProgress.targetRevenue)}
                  actualValue={formatCurrency(monthProgress.actualRevenue)}
                  compliance={monthProgress.revenueCompliance}
                />
                <ProgressMetricRow
                  label="Ticket promedio"
                  targetLabel={`Objetivo al día ${monthProgress.progressDay}`}
                  targetValue={
                    monthProgress.targetTicket != null
                      ? formatCurrency(monthProgress.targetTicket)
                      : "—"
                  }
                  actualValue={
                    monthProgress.actualTicket != null
                      ? formatCurrency(monthProgress.actualTicket)
                      : "—"
                  }
                  compliance={monthProgress.ticketCompliance}
                />
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                Cargá cubiertos y facturación reales en el calendario para comparar contra el
                objetivo acumulado del mes.
              </p>
            )}
          </div>
        </SectionCard>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Distribución por franja horaria
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Porcentaje de cubiertos por servicio
                </p>
              </div>
              <SumBadge sum={slotSum} label="Total" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-stone-900">
                        {capitalizeSlot(slot)}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatNumber(results.coversBySlotWeekly[slot])} cubiertos
                        / sem
                      </p>
                    </div>
                    <div className="relative w-24 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={params.slotPercentages[slot]}
                        onChange={(e) =>
                          updateSlotPercentage(slot, e.target.value)
                        }
                        className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pl-3 pr-7 text-sm text-stone-900 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                        %
                      </span>
                    </div>
                  </div>
                  <PercentageBar
                    value={params.slotPercentages[slot]}
                    total={100}
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200 pt-3">
                    <div>
                      <p className="text-xs text-stone-500">Fact. semanal</p>
                      <p className="text-sm font-semibold text-stone-900">
                        {formatCurrency(results.revenueBySlotWeekly[slot])}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Fact. mensual</p>
                      <p className="text-sm font-semibold text-stone-900">
                        {formatCurrency(results.revenueBySlotMonthly[slot])}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Distribución por día
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Porcentaje del total mensual por día de la semana
                </p>
              </div>
              <SumBadge sum={daySum} label="Total" />
            </div>

            <div className="mt-6 space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="grid grid-cols-[7rem_5rem_1fr] items-center gap-3">
                  <span className="text-sm font-medium text-stone-700">
                    {capitalizeDay(day)}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={params.dayPercentages[day]}
                      onChange={(e) => updateDayPercentage(day, e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-stone-50 py-1.5 pl-3 pr-7 text-sm text-stone-900 outline-none transition focus:border-amber-700 focus:bg-white focus:ring-2 focus:ring-amber-700/20"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                      %
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">
                      {formatNumber(results.coversByDay[day])} cub / jornada ·{" "}
                      {results.dayCounts[day]}× en el mes
                    </p>
                    <PercentageBar
                      value={params.dayPercentages[day]}
                      total={100}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-8">
          <MonthlyCalendarWeeks results={results} monthLabel={calendar.label} />

          {/* Rotation matrix */}
          <div className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
            <div className="bg-slate-800 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-white">
                Rotación por turno
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Cubiertos proyectados vs. capacidad del local ({formatNumber(LOCAL_CAPACITY)} asientos) ·{" "}
                <span className="text-emerald-400">verde &lt; 40 %</span>{" "}·{" "}
                <span className="text-sky-400">azul 40–75 %</span>{" "}·{" "}
                <span className="text-amber-400">ámbar 75–100 %</span>{" "}·{" "}
                <span className="text-red-400">rojo ≥ 100 %</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-slate-400 bg-slate-700 px-3 py-2 text-left text-white">
                      Franja
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="border border-slate-400 bg-slate-700 px-2 py-2 text-center font-semibold text-white"
                      >
                        {capitalizeDay(day).slice(0, 3)}
                      </th>
                    ))}
                    <th className="border border-slate-400 bg-slate-600 px-2 py-2 text-center font-semibold text-white">
                      Prom.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => {
                    const dayRotations = DAYS.map(
                      (day) => results.coversMatrix[slot][day] / LOCAL_CAPACITY,
                    );
                    const avgRotation =
                      dayRotations.reduce((a, b) => a + b, 0) / dayRotations.length;
                    return (
                      <tr key={slot} className="even:bg-slate-50">
                        <td className="border border-slate-300 bg-slate-100 px-3 py-2 font-medium text-slate-700">
                          {capitalizeSlot(slot)}
                        </td>
                        {DAYS.map((day, i) => {
                          const r = dayRotations[i];
                          return (
                            <td
                              key={day}
                              className={`border border-slate-300 px-2 py-2 text-center ${rotationColor(r)}`}
                            >
                              {r > 0 ? `×${r.toFixed(2)}` : "—"}
                            </td>
                          );
                        })}
                        <td
                          className={`border border-slate-300 px-2 py-2 text-center font-semibold ${rotationColor(avgRotation)}`}
                        >
                          {avgRotation > 0 ? `×${avgRotation.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Daily totals row */}
                  <tr className="bg-slate-700 font-semibold text-white">
                    <td className="border border-slate-500 px-3 py-2">
                      Total día
                    </td>
                    {DAYS.map((day) => {
                      const r = results.dayTotals[day] / LOCAL_CAPACITY;
                      return (
                        <td
                          key={day}
                          className={`border border-slate-500 px-2 py-2 text-center ${r >= 1 ? "text-red-300" : r >= 0.75 ? "text-amber-300" : r >= 0.4 ? "text-sky-300" : "text-emerald-300"}`}
                        >
                          {r > 0 ? `×${r.toFixed(2)}` : "—"}
                        </td>
                      );
                    })}
                    <td className="border border-slate-500 px-2 py-2 text-center text-slate-300">
                      —
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <TicketMatrixEditor
            ticketMatrix={params.ticketMatrix}
            ticketAverageBySlot={results.ticketAverageBySlot}
            onUpdate={updateTicket}
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">
            Resumen por día de la semana
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Cubiertos y facturación por jornada y total mensual según calendario
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                  <th className="pb-3 pr-4 font-medium">Día</th>
                  <th className="pb-3 pr-4 font-medium">% mes</th>
                  <th className="pb-3 pr-4 font-medium">Cub / jornada</th>
                  <th className="pb-3 pr-4 font-medium">Total mes</th>
                  <th className="pb-3 font-medium">Fact. mes</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-b border-stone-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-stone-900">
                      {capitalizeDay(day)}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {formatNumber(params.dayPercentages[day])}%
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {results.dayCounts[day] > 0
                        ? formatNumber(
                            results.weekdayMonthTotals[day].covers / results.dayCounts[day],
                          )
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-stone-600">
                      {formatNumber(results.weekdayMonthTotals[day].covers)}
                    </td>
                    <td className="py-3 text-stone-900">
                      {formatCurrency(results.weekdayMonthTotals[day].revenue)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50 font-semibold text-stone-900">
                  <td className="py-3 pr-4">Total mes</td>
                  <td className="py-3 pr-4">{formatNumber(daySum)}%</td>
                  <td className="py-3 pr-4">—</td>
                  <td className="py-3 pr-4">{formatNumber(results.monthlyCoversTotal)}</td>
                  <td className="py-3">{formatCurrency(results.monthlyRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
    </>
  );

  if (embedded) {
    return <div className="space-y-8 px-6 py-6">{body}</div>;
  }

  return <PageLayout width="narrow">{body}</PageLayout>;
}
