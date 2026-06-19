"use client";

import { useMemo, useState } from "react";
import { capitalizeDay, formatCurrency } from "@/lib/format";
import type { DashboardResults } from "@/lib/types";
import {
  computeEventualDailySummary,
  createEventualDailyHire,
  type EventualDailyHire,
} from "@/lib/staffing/eventual-daily";
import { EVENTUAL_SHIFT_HOURS } from "@/lib/staffing/eventual";
import type { PayrollEntry } from "@/lib/payroll/types";
import { tableStyles } from "@/lib/ui/table-styles";

type EventualDailyHiringTableProps = {
  results: DashboardResults;
  payrollEntries: PayrollEntry[];
  hires: EventualDailyHire[];
  onChange: React.Dispatch<React.SetStateAction<EventualDailyHire[]>>;
};

const t = tableStyles("slate");
const headerCell = t.header;
const bodyCell = t.data;

export default function EventualDailyHiringTable({
  results,
  payrollEntries,
  hires,
  onChange,
}: EventualDailyHiringTableProps) {
  const [selectedDate, setSelectedDate] = useState<number>(
    results.calendarDays[0]?.date ?? 1,
  );
  const [countInput, setCountInput] = useState("1");

  const summary = useMemo(
    () => computeEventualDailySummary(hires, payrollEntries),
    [hires, payrollEntries],
  );

  const usedDates = new Set(summary.rows.map((row) => row.date));

  function weekdayLabel(date: number): string {
    const day = results.calendarDays.find((entry) => entry.date === date);
    return day ? capitalizeDay(day.weekday) : "";
  }

  function addRow() {
    const count = Number(countInput);
    if (!Number.isFinite(count) || count <= 0) return;

    onChange((prev) => {
      const filtered = prev.filter((row) => row.date !== selectedDate);
      return [...filtered, createEventualDailyHire(selectedDate, Math.floor(count))].sort(
        (a, b) => a.date - b.date,
      );
    });
  }

  function updateCount(date: number, value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      onChange((prev) => prev.filter((row) => row.date !== date));
      return;
    }
    onChange((prev) =>
      prev
        .map((row) =>
          row.date === date ? { ...row, count: Math.floor(parsed) } : row,
        )
        .sort((a, b) => a.date - b.date),
    );
  }

  function removeRow(date: number) {
    onChange((prev) => prev.filter((row) => row.date !== date));
  }

  const grossPerShift = summary.rows[0]?.grossPerShift ?? 0;
  const netPerShift = summary.rows[0]?.netPerShift ?? 0;

  return (
    <section className="overflow-hidden rounded-lg border border-amber-300 bg-white shadow-sm">
      <div className="bg-amber-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Eventuales por día del mes</h3>
        <p className="mt-0.5 text-xs text-amber-100">
          Contratación diaria · {formatCurrency(netPerShift)} neto por jornada de{" "}
          {EVENTUAL_SHIFT_HOURS} h (+ CCSS)
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-b border-amber-100 bg-amber-50 px-4 py-4">
        <label className="block min-w-[180px]">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Día del mes
          </span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(Number(e.target.value))}
            className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1.5 text-sm text-stone-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
          >
            {results.calendarDays.map((day) => (
              <option key={day.date} value={day.date}>
                {String(day.date).padStart(2, "0")} · {capitalizeDay(day.weekday)}
                {usedDates.has(day.date) ? " (editar)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-[120px]">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Cantidad
          </span>
          <input
            type="number"
            min={1}
            step={1}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1.5 text-sm tabular-nums outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
          />
        </label>

        <button
          type="button"
          onClick={addRow}
          className="rounded bg-amber-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-800"
        >
          {usedDates.has(selectedDate) ? "Actualizar día" : "Agregar día"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} text-left`}>Fecha</th>
              <th className={`${headerCell} text-left`}>Día</th>
              <th className={`${headerCell} text-center`}>Eventuales</th>
              <th className={`${headerCell} text-right`}>Costo / jornada</th>
              <th className={`${headerCell} text-right`}>Total día</th>
              <th className={`${headerCell} w-12`} aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {summary.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className={`${bodyCell} py-8 text-center text-sm text-stone-500`}>
                  Agregá días con eventuales para estimar el costo mensual.
                </td>
              </tr>
            ) : (
              summary.rows.map((row) => (
                <tr key={row.id} className="bg-white even:bg-amber-50/40">
                  <td className={`${bodyCell} font-medium tabular-nums`}>
                    {String(row.date).padStart(2, "0")}
                  </td>
                  <td className={bodyCell}>{weekdayLabel(row.date)}</td>
                  <td className={`${bodyCell} text-center`}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.count}
                      onChange={(e) => updateCount(row.date, e.target.value)}
                      className="w-16 rounded border border-amber-200 bg-white px-2 py-1 text-center text-sm tabular-nums outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
                    />
                  </td>
                  <td className={`${bodyCell} text-right tabular-nums`}>
                    {formatCurrency(row.grossPerShift)}
                  </td>
                  <td className={`${bodyCell} text-right tabular-nums font-semibold`}>
                    {formatCurrency(row.totalCost)}
                  </td>
                  <td className={`${bodyCell} p-1 text-center`}>
                    <button
                      type="button"
                      onClick={() => removeRow(row.date)}
                      className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                      aria-label={`Quitar eventuales del día ${row.date}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {summary.rows.length > 0 && (
            <tfoot>
              <tr className="bg-amber-100 font-semibold text-amber-950">
                <td colSpan={2} className={`${bodyCell} text-right`}>
                  Total eventuales del mes
                </td>
                <td className={`${bodyCell} text-center tabular-nums`}>
                  {summary.totalShifts} jornadas
                </td>
                <td className={`${bodyCell} text-right tabular-nums`}>
                  {grossPerShift > 0 ? formatCurrency(grossPerShift) : "—"}
                </td>
                <td className={`${bodyCell} text-right tabular-nums`}>
                  {formatCurrency(summary.totalCost)}
                </td>
                <td className={bodyCell} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
