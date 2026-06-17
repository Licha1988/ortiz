"use client";

import { Fragment } from "react";
import {
  STAFFING_PARAM_ROWS,
  type StaffingParamKey,
  type StaffingParams,
} from "@/lib/staffing/params";

type StaffingParamsEditorProps = {
  params: StaffingParams;
  onChange: (key: StaffingParamKey, value: string) => void;
};

const SECTION_COLORS: Record<string, { header: string; stripe: string }> = {
  "Salón AM (9:00 – 17:00)":   { header: "bg-sky-800 border-sky-600",    stripe: "bg-sky-50/30" },
  "Salón PM (17:00 – Cierre)": { header: "bg-indigo-800 border-indigo-600", stripe: "bg-indigo-50/30" },
  "Cocina AM (9:00 – 17:00)":  { header: "bg-slate-700 border-slate-500", stripe: "bg-slate-50/40" },
  "Cocina PM (17:00 – Cierre)":{ header: "bg-slate-800 border-slate-600", stripe: "bg-slate-50/40" },
  "Criterios generales":       { header: "bg-violet-800 border-violet-600", stripe: "" },
};

const hCell =
  "border border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900";
const inputCls =
  "w-full min-w-[4.5rem] border-0 bg-amber-50 px-2 py-2.5 text-center text-sm tabular-nums text-stone-900 outline-none focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/40 focus:ring-inset";

export default function StaffingParamsEditor({
  params,
  onChange,
}: StaffingParamsEditorProps) {
  let currentSection: string | undefined;

  return (
    <section className="overflow-hidden rounded-lg border border-violet-300 bg-white shadow-sm">
      <div className="bg-violet-800 px-4 py-3 text-sm font-semibold tracking-wide text-white">
        Parámetros de operación — editá las celdas amarillas
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              <th className={`${hCell} text-left`}>Puesto / Criterio</th>
              <th className={`${hCell} w-28 text-center`}>Valor</th>
              <th className={`${hCell} w-44 text-left`}>Unidad</th>
              <th className={`${hCell} text-left`}>Para qué sirve</th>
            </tr>
          </thead>
          <tbody>
            {STAFFING_PARAM_ROWS.map((row, idx) => {
              const showSection = row.section && row.section !== currentSection;
              if (row.section) currentSection = row.section;
              const sectionColors = currentSection
                ? (SECTION_COLORS[currentSection] ?? { header: "bg-slate-700", stripe: "" })
                : { header: "bg-slate-700", stripe: "" };

              return (
                <Fragment key={row.type === "input" ? row.key : `fixed-${idx}`}>
                  {showSection && (
                    <tr key={`section-${row.section}`}>
                      <td
                        colSpan={4}
                        className={`border border-slate-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white ${sectionColors.header}`}
                      >
                        {row.section}
                      </td>
                    </tr>
                  )}

                  <tr key={row.type === "input" ? row.key : `fixed-${idx}`} className={`hover:brightness-95 ${sectionColors.stripe}`}>
                    {/* Puesto / Criterio */}
                    <td className="border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-900">
                      {row.label}
                    </td>

                    {/* Valor */}
                    {row.type === "input" ? (
                      <td className="border border-amber-300 bg-amber-50 p-0">
                        <input
                          type="number"
                          min={row.min}
                          step={row.step}
                          value={params[row.key]}
                          onChange={(e) => onChange(row.key, e.target.value)}
                          className={inputCls}
                          aria-label={row.label}
                        />
                      </td>
                    ) : (
                      <td className="border border-stone-200 bg-stone-50 px-3 py-2.5 text-center">
                        {row.badge === "Por demanda" ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            Por demanda
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                            Fijo
                          </span>
                        )}
                      </td>
                    )}

                    {/* Unidad */}
                    <td className="border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-500">
                      {row.unit ?? "—"}
                    </td>

                    {/* Para qué sirve */}
                    <td className="border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600">
                      {row.description}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
