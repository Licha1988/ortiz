import { capitalizeDay, capitalizeSlot, formatCurrency } from "@/lib/format";
import type { DashboardParams, DashboardResults } from "@/lib/types";
import { DAYS, TIME_SLOTS } from "@/lib/types";

type TicketMatrixEditorProps = {
  ticketMatrix: DashboardParams["ticketMatrix"];
  ticketAverageBySlot: DashboardResults["ticketAverageBySlot"];
  onUpdate: (
    slot: (typeof TIME_SLOTS)[number],
    day: (typeof DAYS)[number],
    value: string,
  ) => void;
};

const headerCell =
  "border border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900";
const labelCell =
  "border border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-sm font-medium text-violet-900";
const avgCell =
  "border border-violet-300 bg-violet-100 px-3 py-2.5 text-center text-sm font-semibold tabular-nums text-violet-900";
const inputCell =
  "w-full min-w-[5.5rem] border-0 bg-amber-50 px-2 py-2 text-center text-sm tabular-nums text-stone-900 outline-none focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/40 focus:ring-inset";

export default function TicketMatrixEditor({
  ticketMatrix,
  ticketAverageBySlot,
  onUpdate,
}: TicketMatrixEditorProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
      <div className="bg-violet-800 px-4 py-3 text-center text-sm font-semibold tracking-wide text-white">
        Ticket promedio base — editá las celdas amarillas
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
              <th className={`${headerCell} text-center`}>Prom.</th>
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className={labelCell}>{capitalizeSlot(slot)}</td>
                {DAYS.map((day) => (
                  <td
                    key={day}
                    className="border border-violet-200 bg-amber-50 p-0"
                  >
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={ticketMatrix[slot][day]}
                      onChange={(e) => onUpdate(slot, day, e.target.value)}
                      className={inputCell}
                      aria-label={`Ticket ${capitalizeSlot(slot)} ${capitalizeDay(day)}`}
                    />
                  </td>
                ))}
                <td className={avgCell}>
                  {formatCurrency(ticketAverageBySlot[slot])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
