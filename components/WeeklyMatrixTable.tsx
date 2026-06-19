import { capitalizeDay, capitalizeSlot, formatCovers, formatCurrency } from "@/lib/format";
import { tableStyles } from "@/lib/ui/table-styles";
import type { DashboardResults } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";

type WeeklyMatrixTableProps = {
  title: string;
  results: DashboardResults;
  mode: "covers" | "revenue";
};

const t = tableStyles("operational");
const headerCell = t.header;
const labelCell = t.label;
const dataCell = t.data;
const totalCell = t.total;
const dayTotalLabelCell = t.total;
const dayTotalCell = t.total;
const grandTotalCell = t.grandTotal;

export default function WeeklyMatrixTable({
  title,
  results,
  mode,
}: WeeklyMatrixTableProps) {
  const formatValue = mode === "covers" ? formatCovers : formatCurrency;

  const cellValue = (slot: (typeof TIME_SLOTS)[number], day: (typeof DAYS)[number]) =>
    mode === "covers"
      ? results.coversMatrix[slot][day]
      : results.revenueMatrix[slot][day];

  const slotTotal = (slot: (typeof TIME_SLOTS)[number]) =>
    mode === "covers" ? results.slotTotals[slot] : results.revenueBySlotWeekly[slot];

  const dayTotal = (day: (typeof DAYS)[number]) =>
    mode === "covers" ? results.dayTotals[day] : results.revenueByDay[day];

  const grandTotal =
    mode === "covers" ? results.weeklyCoversTotal : results.weeklyRevenue;

  return (
    <div className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
      <div className="bg-violet-800 px-4 py-3 text-center text-sm font-semibold tracking-wide text-white">
        {title}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} text-left`}>Franja</th>
              {DAYS.map((day) => (
                <th key={day} className={`${headerCell} text-center`}>
                  {capitalizeDay(day)}
                </th>
              ))}
              <th className={`${headerCell} text-center`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className={labelCell}>{capitalizeSlot(slot)}</td>
                {DAYS.map((day) => (
                  <td key={day} className={dataCell}>
                    {formatValue(cellValue(slot, day))}
                  </td>
                ))}
                <td className={totalCell}>{formatValue(slotTotal(slot))}</td>
              </tr>
            ))}
            <tr>
              <td className={dayTotalLabelCell}>Total día</td>
              {DAYS.map((day) => (
                <td key={day} className={dayTotalCell}>
                  {formatValue(dayTotal(day))}
                </td>
              ))}
              <td className={grandTotalCell}>{formatValue(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
