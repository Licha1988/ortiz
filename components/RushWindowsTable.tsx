"use client";

import { useMemo } from "react";
import { formatCovers } from "@/lib/format";
import {
  RUSH_WINDOW_ROWS,
  computeRushSlotMetrics,
  formatRushHour,
  type RushWindowRow,
} from "@/lib/staffing/rush-windows";
import type { StaffingParamKey, StaffingParams } from "@/lib/staffing/params";
import type { DashboardResults } from "@/lib/types";
import { tableStyles } from "@/lib/ui/table-styles";

type RushWindowsTableProps = {
  params: StaffingParams;
  results: DashboardResults;
  onChange: (key: StaffingParamKey, value: string) => void;
};

const t = tableStyles("operational");
const headerCell = t.header;
const labelCell = t.label;
const dataCell = t.data;

const inputCls =
  "w-full min-w-[4rem] rounded border border-violet-200 bg-amber-50 px-2 py-1 text-center text-xs tabular-nums outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300";

function HourInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="number"
      min={0}
      max={24}
      step={0.5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
      aria-label={ariaLabel}
    />
  );
}

function ShareInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} max-w-[4rem]`}
        aria-label={ariaLabel}
      />
      <span className="text-xs text-stone-500">%</span>
    </div>
  );
}

function RushRow({
  row,
  params,
  peakSimultaneous,
  onChange,
}: {
  row: RushWindowRow;
  params: StaffingParams;
  peakSimultaneous: number;
  onChange: RushWindowsTableProps["onChange"];
}) {
  const start = params[row.startKey] as number;
  const end = params[row.endKey] as number;
  const share = params[row.shareKey] as number;
  const dwell = params[row.dwellKey] as number;

  return (
    <tr>
      <td className={labelCell}>{row.label}</td>
      <td className={dataCell}>
        <HourInput
          value={start}
          onChange={(value) => onChange(row.startKey, value)}
          ariaLabel={`Inicio rush ${row.label}`}
        />
      </td>
      <td className={dataCell}>
        <HourInput
          value={end}
          onChange={(value) => onChange(row.endKey, value)}
          ariaLabel={`Fin rush ${row.label}`}
        />
      </td>
      <td className={`${dataCell} text-xs text-stone-600`}>
        {formatRushHour(start)} – {formatRushHour(end)}
      </td>
      <td className={dataCell}>
        <ShareInput
          value={share}
          onChange={(value) => onChange(row.shareKey, value)}
          ariaLabel={`Participación rush ${row.label}`}
        />
      </td>
      <td className={dataCell}>
        <input
          type="number"
          min={0.25}
          max={4}
          step={0.25}
          value={dwell}
          onChange={(e) => onChange(row.dwellKey, e.target.value)}
          className={inputCls}
          aria-label={`Permanencia ${row.label}`}
        />
      </td>
      <td className={`${dataCell} text-center text-xs font-medium tabular-nums text-violet-900`}>
        {formatCovers(Math.round(peakSimultaneous))}
      </td>
    </tr>
  );
}

export default function RushWindowsTable({
  params,
  results,
  onChange,
}: RushWindowsTableProps) {
  const slotMetrics = useMemo(
    () => computeRushSlotMetrics(results, params),
    [results, params],
  );

  return (
    <section className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
      <div className="bg-violet-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Horarios rush</h3>
        <p className="mt-0.5 text-xs text-violet-200">
          Ventanas de pico por franja · pico simultáneo en el día más exigente de la semana
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} text-left`}>Franja</th>
              <th className={`${headerCell} text-center`}>Inicio</th>
              <th className={`${headerCell} text-center`}>Fin</th>
              <th className={`${headerCell} text-center`}>Ventana</th>
              <th className={`${headerCell} text-center`}>% en rush</th>
              <th className={`${headerCell} text-center`}>Permanencia (h)</th>
              <th className={`${headerCell} text-center`}>Pico simult.</th>
            </tr>
          </thead>
          <tbody>
            {RUSH_WINDOW_ROWS.map((row) => (
              <RushRow
                key={row.slot}
                row={row}
                params={params}
                peakSimultaneous={slotMetrics[row.slot].peakSimultaneous}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
