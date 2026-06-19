import { capitalizeDay, capitalizeSlot, formatCovers } from "@/lib/format";
import type { DashboardResults } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";

type WeekdayCoversTableProps = {
  results: DashboardResults;
};

export default function WeekdayCoversTable({ results }: WeekdayCoversTableProps) {
  const slotTotal = (slot: (typeof TIME_SLOTS)[number]) => results.slotTotals[slot] ?? 0;

  const dayTotal = (day: (typeof DAYS)[number]) => results.dayTotals[day] ?? 0;

  const t = {
    header:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900",
    label:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-sm font-medium text-violet-900",
    data: "border border-violet-200 bg-white px-3 py-2.5 text-center text-sm tabular-nums text-stone-900",
    total:
      "border border-violet-300 bg-violet-200 px-3 py-2.5 text-center text-sm font-semibold tabular-nums text-violet-950",
    grandTotal:
      "border border-violet-300 bg-violet-800 px-3 py-2.5 text-center text-sm font-bold tabular-nums text-white",
  };

  return (
    <section className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
      <div className="bg-violet-800 px-4 py-3 text-center text-sm font-semibold tracking-wide text-white">
        Cantidad por semana · lunes a domingo
      </div>
      <p className="border-b border-violet-100 bg-violet-50 px-4 py-2 text-center text-xs text-violet-700">
        Cubiertos esperados por franja según la demanda proyectada del mes
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <th className={`${t.header} text-left`}>Franja</th>
              {DAYS.map((day) => (
                <th key={day} className={`${t.header} text-center`}>
                  {capitalizeDay(day)}
                </th>
              ))}
              <th className={`${t.header} text-center`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className={t.label}>{capitalizeSlot(slot)}</td>
                {DAYS.map((day) => (
                  <td key={day} className={t.data}>
                    {formatCovers(results.coversMatrix[slot][day] ?? 0)}
                  </td>
                ))}
                <td className={t.total}>{formatCovers(slotTotal(slot))}</td>
              </tr>
            ))}
            <tr>
              <td className={t.total}>Total día</td>
              {DAYS.map((day) => (
                <td key={day} className={t.total}>
                  {formatCovers(dayTotal(day))}
                </td>
              ))}
              <td className={t.grandTotal}>{formatCovers(results.weeklyCoversTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
