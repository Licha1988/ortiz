"use client";

import MonthSelector from "@/components/ui/MonthSelector";
import {
  getOperationalMonthEntry,
  getOperationalMonthName,
} from "@/lib/operational-year/catalog";
import { useOperationalYear } from "@/lib/operational-year/OperationalYearProvider";

export default function OperationalMonthBar() {
  const { activeMonthKey, setActiveMonthKey } = useOperationalYear();
  const calendar = getOperationalMonthEntry(activeMonthKey);
  const monthName = getOperationalMonthName(calendar.month);

  return (
    <section className="overflow-hidden rounded-xl border border-violet-300 bg-white shadow-sm">
      <div className="bg-violet-900 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
          Mes operativo
        </p>
        <p className="mt-1 text-xl font-bold text-white">
          {monthName} {calendar.year}
        </p>
        <p className="mt-1 text-xs text-violet-200">
          Proyecciones, equipo y parámetros se guardan por mes de forma independiente
        </p>
      </div>
      <div className="border-t border-violet-100 bg-violet-50 px-5 py-4">
        <MonthSelector
          activeMonthKey={activeMonthKey}
          onChange={setActiveMonthKey}
        />
      </div>
    </section>
  );
}
