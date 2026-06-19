import { capitalizeDay, capitalizeSlot, formatCurrency, parseCurrency } from "@/lib/format";
import { tableInputCell, tableInputInner, tableStyles } from "@/lib/ui/table-styles";
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

const t = tableStyles("violet");
const headerCell = t.header;
const labelCell = t.label;
const avgCell = t.total;

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
                    className={tableInputCell}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(ticketMatrix[slot][day])}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => onUpdate(slot, day, e.target.value)}
                      className={tableInputInner}
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
