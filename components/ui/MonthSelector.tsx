"use client";

import {
  OPERATIONAL_YEAR_CATALOG,
  type OperationalMonthKey,
} from "@/lib/operational-year/catalog";

type MonthSelectorProps = {
  activeMonthKey: OperationalMonthKey;
  onChange: (key: OperationalMonthKey) => void;
  className?: string;
};

export default function MonthSelector({
  activeMonthKey,
  onChange,
  className = "",
}: MonthSelectorProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {OPERATIONAL_YEAR_CATALOG.map((month) => {
        const active = month.key === activeMonthKey;
        return (
          <button
            key={month.key}
            type="button"
            onClick={() => onChange(month.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-violet-800 text-white shadow-sm"
                : "border border-stone-300 bg-white text-stone-600 hover:border-violet-400 hover:text-violet-900"
            }`}
          >
            {month.label}
          </button>
        );
      })}
    </div>
  );
}
