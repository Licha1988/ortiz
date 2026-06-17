"use client";

import { useMemo } from "react";
import { calculateDashboard, sumValues } from "@/lib/calculations";
import {
  capitalizeDay,
  capitalizeSlot,
  formatCurrency,
  formatNumber,
} from "@/lib/format";
import type { DashboardParams } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";
import WeeklyMatrixTable from "@/components/WeeklyMatrixTable";
import TicketMatrixEditor from "@/components/TicketMatrixEditor";

type DashboardProps = {
  params: DashboardParams;
  setParams: React.Dispatch<React.SetStateAction<DashboardParams>>;
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

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

const LOCAL_CAPACITY = 180;

export default function Dashboard({ params, setParams }: DashboardProps) {
  const results = useMemo(() => calculateDashboard(params), [params]);
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
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
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

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
          <div className="bg-violet-800 px-4 py-3 text-sm font-semibold tracking-wide text-white">
            Parámetro base
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-end gap-6">
              <label className="block min-w-[200px] flex-1">
                <span className="text-sm font-medium text-violet-900">
                  Cubiertos mensuales proyectados
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
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Cubiertos semanales"
            value={formatNumber(results.weeklyCovers)}
            hint="Proyección semanal equivalente"
          />
          <KpiCard
            label="Facturación semanal"
            value={formatCurrency(results.weeklyRevenue)}
          />
          <KpiCard
            label="Facturación mensual"
            value={formatCurrency(results.monthlyRevenue)}
            hint="Según cubiertos y ticket por franja"
          />
          <KpiCard
            label="Ticket promedio ponderado"
            value={formatCurrency(results.weightedAvgTicket)}
            hint="Promedio según cubiertos y tickets"
          />
        </section>

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
                  Porcentaje de cubiertos semanales por día
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
                      {formatNumber(results.coversByDay[day])} cubiertos / sem
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
          <WeeklyMatrixTable
            title="Cantidad por semana"
            results={results}
            mode="covers"
          />

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

          <WeeklyMatrixTable
            title="Facturación por semana"
            results={results}
            mode="revenue"
          />
        </section>

        <section>
          <TicketMatrixEditor
            ticketMatrix={params.ticketMatrix}
            ticketAverageBySlot={results.ticketAverageBySlot}
            onUpdate={updateTicket}
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">
            Resumen semanal por día
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Cubiertos y facturación estimada por jornada
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                  <th className="pb-3 pr-4 font-medium">Día</th>
                  <th className="pb-3 pr-4 font-medium">% semanal</th>
                  <th className="pb-3 pr-4 font-medium">Cubiertos</th>
                  <th className="pb-3 font-medium">Facturación</th>
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
                      {formatNumber(results.coversByDay[day])}
                    </td>
                    <td className="py-3 text-stone-900">
                      {formatCurrency(results.revenueByDay[day])}
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50 font-semibold text-stone-900">
                  <td className="py-3 pr-4">Total semanal</td>
                  <td className="py-3 pr-4">{formatNumber(daySum)}%</td>
                  <td className="py-3 pr-4">{formatNumber(results.weeklyCovers)}</td>
                  <td className="py-3">{formatCurrency(results.weeklyRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
    </main>
  );
}
