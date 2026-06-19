"use client";

import { useMemo } from "react";
import {
  buildMonthCalendarWeeks,
  getMonthCalendarBounds,
  type CalendarDayCell,
} from "@/lib/operational-year/buildMonthCalendarWeeks";
import type { DayActuals } from "@/lib/operational-year/actuals";
import {
  aggregateObjectiveCompliance,
  compliancePercent,
  formatCompliance,
  objectiveComplianceTone,
  summarizeWeekActuals,
} from "@/lib/operational-year/compliance";
import { getDayActual, sumMonthActuals } from "@/lib/operational-year/actuals";
import { useOperationalYear } from "@/lib/operational-year/OperationalYearProvider";
import { capitalizeDay, dayShort, formatCovers, formatCurrency, parseCurrency } from "@/lib/format";
import { editableInput } from "@/lib/ui/tokens";
import { tableStyles } from "@/lib/ui/table-styles";
import type { DashboardResults } from "@/lib/types";
import { DAYS } from "@/lib/types";

type MonthlyCalendarWeeksProps = {
  results: DashboardResults;
  monthLabel: string;
};

const t = tableStyles("operational");

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function ComplianceBadge({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
        —
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${objectiveComplianceTone(value)}`}
    >
      {formatCompliance(value)}
    </span>
  );
}

function DayCell({
  day,
  actual,
  onUpdateActual,
}: {
  day: CalendarDayCell | null;
  actual: DayActuals;
  onUpdateActual: (patch: Partial<DayActuals>) => void;
}) {
  if (!day) {
    return (
      <td className="border border-violet-100 bg-stone-100/50 px-2 py-4 text-center align-top">
        <span className="text-xs text-stone-300">—</span>
      </td>
    );
  }

  const monthEdgeClass = day.isMonthStart
    ? "ring-2 ring-emerald-500 ring-inset"
    : day.isMonthEnd
      ? "ring-2 ring-violet-600 ring-inset"
      : "";
  const coversCompliance =
    actual.covers != null ? compliancePercent(actual.covers, day.covers) : null;
  const revenueCompliance =
    actual.revenue != null ? compliancePercent(actual.revenue, day.revenue) : null;

  return (
    <td
      className={`border-2 border-violet-200 bg-white px-2 py-3 align-top transition-colors ${monthEdgeClass}`}
    >
      <div>
        <p className="text-lg font-bold tabular-nums text-stone-900">{day.date}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">
          {dayShort(day.weekday)}
        </p>
      </div>

      <div className="mt-3 space-y-2 border-t border-black/10 pt-2">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] text-stone-800">
            Cub: <span className="tabular-nums font-medium">{formatCovers(day.covers)}</span>
          </p>
          <ComplianceBadge value={coversCompliance} />
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] text-stone-800">
            Fact: <span className="tabular-nums font-medium">{formatCurrency(day.revenue)}</span>
          </p>
          <ComplianceBadge value={revenueCompliance} />
        </div>

        <div className="space-y-1.5 border-t border-black/10 pt-2">
          <label className="block text-[10px] text-stone-600">
            Cub
            <input
              type="number"
              min={0}
              step={1}
              value={actual.covers ?? ""}
              onChange={(e) => onUpdateActual({ covers: parseOptionalNumber(e.target.value) })}
              placeholder="—"
              className={`${editableInput} mt-0.5 w-full rounded-md px-2 py-1 text-[11px] tabular-nums`}
            />
          </label>
          <label className="block text-[10px] text-stone-600">
            Fact
            <input
              type="text"
              inputMode="numeric"
              value={actual.revenue != null ? formatCurrency(actual.revenue) : ""}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (digits === "") {
                  onUpdateActual({ revenue: undefined });
                  return;
                }
                const parsed = parseCurrency(e.target.value);
                if (parsed !== null) onUpdateActual({ revenue: parsed });
              }}
              placeholder="—"
              className={`${editableInput} mt-0.5 w-full rounded-md px-2 py-1 text-[11px] tabular-nums`}
            />
          </label>
        </div>
      </div>
    </td>
  );
}

export default function MonthlyCalendarWeeks({ results, monthLabel }: MonthlyCalendarWeeksProps) {
  const { activeMonthActuals, setDayActual } = useOperationalYear();

  const weeks = useMemo(() => buildMonthCalendarWeeks(results), [results]);
  const bounds = useMemo(() => getMonthCalendarBounds(results), [results]);
  const monthActualTotals = useMemo(
    () => sumMonthActuals(activeMonthActuals),
    [activeMonthActuals],
  );

  const monthCompliance = aggregateObjectiveCompliance(
    results.monthlyCoversTotal,
    results.monthlyRevenue,
    monthActualTotals.covers,
    monthActualTotals.revenue,
    Object.values(activeMonthActuals).some((day) => day.covers != null),
    Object.values(activeMonthActuals).some((day) => day.revenue != null),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Calendario — {monthLabel}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {capitalizeDay(bounds.startWeekday)} {bounds.startDate} →{" "}
            {capitalizeDay(bounds.endWeekday)} {bounds.endDate}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Cumplimiento del mes</p>
          <ComplianceBadge value={monthCompliance} />
        </div>
      </div>

      {weeks.map((week) => {
        const weekSummary = summarizeWeekActuals(week, activeMonthActuals);
        const weekCompliance = aggregateObjectiveCompliance(
          weekSummary.targetCovers,
          weekSummary.targetRevenue,
          weekSummary.actualCovers,
          weekSummary.actualRevenue,
          weekSummary.hasCoversData,
          weekSummary.hasRevenueData,
        );

        return (
          <div
            key={week.weekIndex}
            className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-violet-800 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-wide text-white">
                  Semana {week.weekIndex}
                </p>
                <ComplianceBadge value={weekCompliance} />
              </div>
              <span className="text-xs tabular-nums text-violet-100">
                {formatCovers(week.weekCovers)} cub · {formatCurrency(week.weekRevenue)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr>
                    {DAYS.map((day) => (
                      <th key={day} className={`${t.header} text-center`}>
                        {capitalizeDay(day)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {week.days.map((day, index) => (
                      <DayCell
                        key={`${week.weekIndex}-${DAYS[index]}`}
                        day={day}
                        actual={day ? getDayActual(activeMonthActuals, day.date) : {}}
                        onUpdateActual={(patch) => {
                          if (day) setDayActual(day.date, patch);
                        }}
                      />
                    ))}
                  </tr>
                  <tr className="bg-violet-50 text-xs text-violet-900">
                    <td colSpan={7} className="border border-violet-200 px-4 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            Semana {week.weekIndex}: {formatCovers(week.weekCovers)} cub ·{" "}
                            {formatCurrency(week.weekRevenue)}
                          </p>
                          {(weekSummary.hasCoversData || weekSummary.hasRevenueData) && (
                            <p className="mt-0.5 tabular-nums text-violet-700">
                              Real: {formatCovers(weekSummary.actualCovers)} cub ·{" "}
                              {formatCurrency(weekSummary.actualRevenue)}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-2">
                          Cumplimiento semanal
                          <ComplianceBadge value={weekCompliance} />
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold tabular-nums">
              {formatCovers(results.monthlyCoversTotal)} cub ·{" "}
              {formatCurrency(results.monthlyRevenue)}
            </p>
            {(monthActualTotals.covers > 0 || monthActualTotals.revenue > 0) && (
              <p className="mt-1 tabular-nums">
                Real: {formatCovers(monthActualTotals.covers)} cub ·{" "}
                {formatCurrency(monthActualTotals.revenue)}
              </p>
            )}
          </div>
          <div className="inline-flex items-center gap-2">
            Cumplimiento
            <ComplianceBadge value={monthCompliance} />
          </div>
        </div>
      </div>
    </section>
  );
}
