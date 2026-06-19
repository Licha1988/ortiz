"use client";

import { formatCovers } from "@/lib/format";
import type { PositionCoverageProfile } from "@/lib/staffing/position-coverage";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  type StaffEmploymentType,
  type StaffPosition,
} from "@/lib/staffing/positions";
import { tableStyles } from "@/lib/ui/table-styles";

type PositionCoverageTableProps = {
  peakDayCovers: number;
  profiles: PositionCoverageProfile[];
  onEmploymentTypeChange: (position: StaffPosition, value: StaffEmploymentType) => void;
  onCoverageRatioChange: (position: StaffPosition, value: string) => void;
};

const t = tableStyles("slate");
const headerCell = t.header;
const bodyCell = `${t.data} text-left`;

export default function PositionCoverageTable({
  peakDayCovers,
  profiles,
  onEmploymentTypeChange,
  onCoverageRatioChange,
}: PositionCoverageTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-sm">
      <div className="bg-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          Ratios de cobertura y operación
        </h3>
        <p className="mt-1 text-xs text-slate-300">
          Pico diario de referencia: {formatCovers(peakDayCovers)} cub · Inputs para que el
          gerente arme la plantilla en Mi equipo
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} text-left`}>Puesto</th>
              <th className={`${headerCell} text-left`}>Dependencia</th>
              <th className={`${headerCell} text-right`}>Ratio cobertura</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const isDependiente = profile.employmentType === "dependiente";

              return (
                <tr key={profile.position} className="bg-white even:bg-slate-50">
                  <td className={`${bodyCell} font-medium text-stone-900`}>{profile.label}</td>
                  <td className={bodyCell}>
                    <select
                      value={profile.employmentType}
                      onChange={(e) =>
                        onEmploymentTypeChange(
                          profile.position,
                          e.target.value as StaffEmploymentType,
                        )
                      }
                      className="w-full min-w-[9rem] rounded border border-slate-300 bg-amber-50 px-2 py-1 text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                    >
                      {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`${bodyCell} text-right`}>
                    {isDependiente ? (
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={profile.coverageRatio ?? ""}
                        onChange={(e) => onCoverageRatioChange(profile.position, e.target.value)}
                        className="w-full min-w-[6rem] rounded border border-slate-300 bg-amber-50 px-2 py-1 text-right text-xs tabular-nums outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-300"
                        aria-label={`Ratio ${profile.label}`}
                      />
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
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
