"use client";

import { formatCovers, formatCurrency, parseCurrency } from "@/lib/format";
import { ccssRateFromPercent } from "@/lib/payroll/ccss";
import type { PayrollEntry } from "@/lib/payroll/types";
import {
  listPositionProfiles,
  resolveCcssPercentForPosition,
  setPositionCcssRate,
  setPositionNetSalary,
} from "@/lib/staffing/position-payroll";
import { tableStyles } from "@/lib/ui/table-styles";
import { EVENTUAL_SHIFT_HOURS } from "@/lib/staffing/eventual";

type MaturityMatrixProps = {
  monthlyCovers: number;
  maturityLevel: string;
  payrollEntries: PayrollEntry[];
  setPayrollEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
};

const t = tableStyles("slate");
const headerCell = t.header;
const bodyCell = `${t.data} text-left`;

export default function MaturityMatrix({
  monthlyCovers,
  maturityLevel,
  payrollEntries,
  setPayrollEntries,
}: MaturityMatrixProps) {
  const positionProfiles = listPositionProfiles(payrollEntries);

  function updateSalary(position: (typeof positionProfiles)[number]["position"], value: string) {
    const parsed = parseCurrency(value);
    if (parsed === null || parsed < 0) return;
    setPayrollEntries((prev) => setPositionNetSalary(prev, position, parsed));
  }

  function updateCcssPercent(
    position: (typeof positionProfiles)[number]["position"],
    value: string,
  ) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return;
    setPayrollEntries((prev) =>
      setPositionCcssRate(prev, position, ccssRateFromPercent(parsed)),
    );
  }

  function nudgeCcssPercent(
    position: (typeof positionProfiles)[number]["position"],
    delta: number,
  ) {
    setPayrollEntries((prev) => {
      const current = resolveCcssPercentForPosition(prev, position);
      const next = Math.round((current + delta) * 10) / 10;
      return setPositionCcssRate(prev, position, ccssRateFromPercent(next));
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
      <div className="bg-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          Estructura de puestos — sueldos
        </h3>
        <p className="mt-1 text-xs text-slate-300">{maturityLevel}</p>
      </div>

      <div className="border-b border-slate-300 bg-rose-50 px-4 py-3">
        <p className="text-xs font-medium uppercase text-rose-800">Driver</p>
        <p className="mt-1 text-sm text-stone-700">Cubiertos mensuales</p>
        <p className="mt-1 text-lg font-semibold text-stone-900">{formatCovers(monthlyCovers)}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} text-left`}>Puesto</th>
              <th className={`${headerCell} text-right`}>Sueldo neto</th>
              <th className={`${headerCell} text-right`}>CCSS</th>
              <th className={`${headerCell} text-right`}>Sueldo bruto</th>
            </tr>
          </thead>
          <tbody>
            {positionProfiles.map((profile) => {
              const ccssPercent = Math.round(profile.ccssRate * 1000) / 10;

              return (
                <tr key={profile.position} className="bg-white even:bg-slate-50">
                  <td className={`${bodyCell} font-medium text-stone-900`}>
                    <div>{profile.label}</div>
                    {profile.position === "eventual" && (
                      <p className="mt-0.5 text-[11px] font-normal text-stone-500">
                        {formatCurrency(profile.netSalary)} por jornada de {EVENTUAL_SHIFT_HOURS} h
                      </p>
                    )}
                  </td>
                  <td className={`${bodyCell} text-right`}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(profile.netSalary)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateSalary(profile.position, e.target.value)}
                      className="w-full min-w-[6.5rem] rounded border border-slate-300 bg-amber-50 px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                    />
                  </td>
                  <td className={`${bodyCell} text-right`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="min-w-[5.5rem] tabular-nums text-stone-800">
                        {ccssPercent > 0 ? formatCurrency(profile.ccss) : "—"}
                      </span>
                      <div className="inline-flex items-center rounded border border-slate-300 bg-amber-50">
                        <button
                          type="button"
                          onClick={() => nudgeCcssPercent(profile.position, -0.5)}
                          className="px-1.5 py-0.5 text-xs text-stone-600 hover:bg-amber-100"
                          aria-label={`Reducir CCSS ${profile.label}`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={ccssPercent}
                          onChange={(e) => updateCcssPercent(profile.position, e.target.value)}
                          className="w-12 border-x border-slate-300 bg-transparent px-1 py-0.5 text-center text-xs tabular-nums outline-none"
                        />
                        <span className="pr-1 text-[10px] text-stone-500">%</span>
                        <button
                          type="button"
                          onClick={() => nudgeCcssPercent(profile.position, 0.5)}
                          className="px-1.5 py-0.5 text-xs text-stone-600 hover:bg-amber-100"
                          aria-label={`Aumentar CCSS ${profile.label}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className={`${bodyCell} text-right tabular-nums font-semibold`}>
                    {formatCurrency(profile.grossSalary)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
