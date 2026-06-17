"use client";

import { Fragment, useMemo, useState } from "react";
import { formatCurrency, formatCovers } from "@/lib/format";
import {
  computePayrollSummary,
  payrollHealthColor,
  staffingToPayrollSuggestions,
} from "@/lib/payroll/calculations";
import {
  CATEGORY_LABELS,
  DEFAULT_REFUERZOS,
  MANAGEMENT_ROLE_IDS,
  PAYROLL_CATEGORY_ORDER,
} from "@/lib/payroll/data";
import type { PayrollEntry, PayrollRoleId, RefuerzoEntry } from "@/lib/payroll/types";
import type { RequiredHeadcount } from "@/lib/staffing/types";
import type { DashboardParams } from "@/lib/types";

type PayrollDashboardProps = {
  params: DashboardParams;
  setParams: React.Dispatch<React.SetStateAction<DashboardParams>>;
  monthlyRevenue: number;
  entries: PayrollEntry[];
  setEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
  requiredCounts: RequiredHeadcount;
};

function updateEntry(
  entries: PayrollEntry[],
  roleId: PayrollRoleId,
  patch: Partial<PayrollEntry>,
): PayrollEntry[] {
  return entries.map((e) => (e.roleId === roleId ? { ...e, ...patch } : e));
}

export default function PayrollDashboard({
  params,
  setParams,
  monthlyRevenue,
  entries,
  setEntries,
  requiredCounts,
}: PayrollDashboardProps) {
  const [refuerzos] = useState<RefuerzoEntry[]>(DEFAULT_REFUERZOS);

  const suggested = useMemo(
    () => staffingToPayrollSuggestions(requiredCounts),
    [requiredCounts],
  );

  const summary = useMemo(
    () => computePayrollSummary(entries, suggested, monthlyRevenue),
    [entries, suggested, monthlyRevenue],
  );

  const equipoHealth = payrollHealthColor(summary.equipoToRevenuePercent);

  function updateSalary(roleId: PayrollRoleId, value: string) {
    const parsed = Number(value.replace(/\D/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setEntries((prev) => updateEntry(prev, roleId, { netSalary: parsed }));
  }

  function updateQty(roleId: PayrollRoleId, value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) return;
    setEntries((prev) => updateEntry(prev, roleId, { quantity: parsed }));
  }

  function updateMonthlyCovers(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setParams((prev) => ({ ...prev, monthlyCovers: parsed }));
  }

  const totalHeadcount = entries.reduce((s, e) => s + e.quantity, 0);

  // ── Style constants ──────────────────────────────────────────────────────────
  const hCell =
    "border-b border-r border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900 last:border-r-0";
  const sectionTd =
    "border-b border-r border-slate-400 bg-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 last:border-r-0";
  const labelTd =
    "border-b border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-800";
  const inputTd = "border-b border-r border-amber-300 bg-amber-50 p-0";
  const calcTd =
    "border-b border-r border-stone-200 bg-white px-4 py-3 text-right text-sm tabular-nums text-stone-600";
  const totalTd =
    "border-b border-r border-stone-100 bg-stone-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 last:border-r-0";
  const footTd =
    "border-r border-violet-400 bg-violet-800 px-4 py-3 text-sm font-bold tabular-nums text-white last:border-r-0";

  const inputCls =
    "h-full w-full border-0 bg-transparent px-3 py-3 text-sm tabular-nums text-stone-900 outline-none focus:bg-amber-100";

  return (
    <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
        <div className="border-b border-violet-100 bg-violet-800 px-5 py-3.5">
          <p className="text-sm font-semibold text-white">Parámetros operativos</p>
        </div>
        {/* Row 1: inputs + facturación */}
        <div className="flex flex-wrap items-stretch gap-0 divide-x divide-stone-100">
          {/* Cubiertos input */}
          <div className="min-w-[200px] flex-1 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
              Cubiertos mensuales
            </p>
            <input
              type="number"
              min={0}
              step={100}
              value={params.monthlyCovers}
              onChange={(e) => updateMonthlyCovers(e.target.value)}
              className="mt-2 w-full max-w-[180px] rounded-lg border border-violet-300 bg-amber-50 px-3 py-2 text-lg font-semibold text-stone-900 outline-none focus:border-violet-500 focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/30"
            />
          </div>

          {/* Facturación mensual */}
          <div className="min-w-[180px] flex-1 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Facturación mensual
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              {formatCurrency(monthlyRevenue)}
            </p>
          </div>

          {/* Nómina total */}
          <div className="min-w-[180px] flex-1 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Nómina total
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              {formatCurrency(summary.totalPayroll)}
            </p>
            <p className="text-xs text-stone-400">
              {summary.payrollToRevenuePercent.toFixed(1)}% de la facturación
            </p>
          </div>

          {/* Headcount equipo */}
          <div className="min-w-[120px] flex-1 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Equipo contratado
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-900">{summary.contractedHeadcount}</p>
          </div>

          {/* Headcount sugerido */}
          <div className="min-w-[120px] flex-1 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Equipo sugerido
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-900">{summary.suggestedHeadcount}</p>
          </div>
        </div>

        {/* Row 2: desglose gestión vs equipo */}
        <div className="flex flex-wrap items-stretch gap-0 divide-x divide-stone-100 border-t border-stone-100">
          {/* Costo de gestión */}
          <div className="min-w-[240px] flex-1 bg-violet-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Costo de gestión operativa
            </p>
            <p className="mt-1 text-xs text-violet-500">Lisandro + Bruno Bonnao</p>
            <p className="mt-2 text-2xl font-bold text-violet-800">
              {formatCurrency(summary.managementSubtotal)}
            </p>
            <p className="mt-1 text-sm font-semibold text-violet-600">
              {summary.managementToRevenuePercent.toFixed(1)}%
              <span className="ml-1 text-xs font-normal text-violet-400">de la facturación</span>
            </p>
          </div>

          {/* Costo de equipo */}
          <div className={`min-w-[240px] flex-1 px-5 py-4 ${equipoHealth.bg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${equipoHealth.text} opacity-80`}>
              Costo de equipo
            </p>
            <p className={`mt-1 text-xs ${equipoHealth.text} opacity-60`}>
              Personal operativo (sin Lisandro ni Bruno)
            </p>
            <p className={`mt-2 text-2xl font-bold ${equipoHealth.text}`}>
              {formatCurrency(summary.equipoSubtotal)}
            </p>
            <p className={`mt-1 text-sm font-semibold ${equipoHealth.text}`}>
              {summary.equipoToRevenuePercent.toFixed(1)}%
              <span className={`ml-1 text-xs font-normal ${equipoHealth.text} opacity-70`}>de la facturación · {equipoHealth.label}</span>
            </p>
          </div>
        </div>

        {/* ── Comparison bar: equipo contracted vs suggested ── */}
        {(() => {
          const gap = summary.payrollGap;  // equipo only
          const isOver = gap < 0;
          const isUnder = gap > 0;
          const pctDiff = summary.equipoSubtotal > 0
            ? Math.abs(gap / summary.equipoSubtotal * 100)
            : 0;
          return (
            <div className={`border-t px-5 py-4 ${isOver ? "bg-sky-50 border-sky-100" : isUnder ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isOver ? "text-sky-700" : isUnder ? "text-amber-700" : "text-emerald-700"}`}>
                    Equipo —{" "}
                    {isOver
                      ? "sobredimensionado respecto a la demanda"
                      : isUnder
                        ? "subdotado — la demanda requiere mayor inversión"
                        : "nómina de equipo alineada con la demanda"}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Equipo contratado: <strong>{formatCurrency(summary.equipoSubtotal)}</strong>
                    {" "}({summary.equipoToRevenuePercent.toFixed(1)}% facturación)
                    {" · "}
                    Sugerido: <strong>{formatCurrency(summary.suggestedPayroll)}</strong>
                    {" "}({summary.suggestedToRevenuePercent.toFixed(1)}% facturación)
                  </p>
                </div>
                <div className={`rounded-xl px-5 py-3 text-center ${isOver ? "bg-sky-100" : isUnder ? "bg-amber-100" : "bg-emerald-100"}`}>
                  <p className={`text-2xl font-bold tabular-nums ${isOver ? "text-sky-700" : isUnder ? "text-amber-700" : "text-emerald-700"}`}>
                    {gap === 0 ? "OK" : (gap > 0 ? "+" : "") + formatCurrency(gap)}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-medium uppercase tracking-wide ${isOver ? "text-sky-600" : isUnder ? "text-amber-600" : "text-emerald-600"}`}>
                    {gap === 0 ? "Alineado" : isOver ? `Ahorro potencial ${pctDiff.toFixed(1)}%` : `Inversión adicional ${pctDiff.toFixed(1)}%`}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Benchmark bar — equipo */}
        <div className="border-t border-stone-100 bg-stone-50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <span className="w-20 text-right text-xs text-stone-400">0%</span>
            <div className="relative flex-1 h-3 overflow-hidden rounded-full bg-stone-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${equipoHealth.bg}`}
                style={{ width: `${Math.min(summary.equipoToRevenuePercent, 100)}%` }}
              />
              <div className="pointer-events-none absolute inset-y-0 left-[30%] w-px bg-emerald-500/60" />
              <div className="pointer-events-none absolute inset-y-0 left-[40%] w-px bg-amber-500/60" />
            </div>
            <span className="w-16 text-xs text-stone-400">
              {summary.equipoToRevenuePercent.toFixed(1)}%
            </span>
          </div>
          <p className="mt-1 text-center text-[10px] text-stone-400">
            Equipo (sin gestión) — Saludable &lt;30% · Atención 30–40% · Crítico &gt;40%
          </p>
        </div>
      </section>

      {/* ── Tabla principal ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
        <div className="border-b border-violet-100 bg-violet-800 px-5 py-3.5">
          <p className="text-sm font-semibold text-white">
            Consolidado estructura — editá las celdas amarillas
          </p>
          <p className="mt-0.5 text-xs text-violet-200">
            Cantidad y sueldo neto son editables · CCSS, bruto y total se calculan automáticamente
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <colgroup>
              <col className="w-auto" />
              <col className="w-20" />
              <col className="w-40" />
              <col className="w-32" />
              <col className="w-36" />
              <col className="w-36" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-36" />
            </colgroup>
            <thead>
              <tr>
                <th className={`${hCell} text-left`}>Rol</th>
                <th className={`${hCell} text-center`}>Contratado</th>
                <th className={`${hCell} text-right`}>Sueldo neto</th>
                <th className={`${hCell} text-right`}>CCSS (34%)</th>
                <th className={`${hCell} text-right`}>Sueldo bruto</th>
                <th className={`${hCell} text-right`}>Costo contratado</th>
                <th className={`${hCell} text-center`}>Sugerido</th>
                <th className={`${hCell} text-center`}>Δ Pers.</th>
                <th className={`${hCell} text-right`}>Δ Costo</th>
              </tr>
            </thead>

            <tbody>
              {/* ── Gestión operativa (Lisandro + Bruno) ── */}
              {(() => {
                const mgmtRows = summary.rows.filter((r) => MANAGEMENT_ROLE_IDS.has(r.roleId));
                if (mgmtRows.length === 0) return null;
                const mgmtTotal = mgmtRows.reduce((s, r) => s + r.rowTotal, 0);
                return (
                  <Fragment key="gestion">
                    <tr>
                      <td colSpan={9} className="border-b border-r border-violet-400 bg-violet-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-violet-100">
                        Gestión operativa — Costo fijo independiente de la demanda
                      </td>
                    </tr>
                    {mgmtRows.map((row) => (
                      <tr key={row.roleId} className="group bg-violet-50/40 hover:bg-violet-50">
                        <td className={labelTd}>
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="font-semibold text-violet-900">{row.label}</span>
                            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                              gestión
                            </span>
                          </div>
                          {row.notes && <p className="mt-0.5 text-xs text-violet-400">{row.notes}</p>}
                        </td>
                        <td className={inputTd}>
                          <input type="number" min={1} step={1} value={row.quantity}
                            onChange={(e) => updateQty(row.roleId, e.target.value)}
                            className={`${inputCls} text-center`} />
                        </td>
                        <td className={inputTd}>
                          <input type="text" inputMode="numeric" value={formatCurrency(row.netSalary)}
                            onChange={(e) => updateSalary(row.roleId, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={`${inputCls} text-right`} />
                        </td>
                        <td className={calcTd}>
                          {row.hasCCSS ? formatCurrency(row.ccss) : <span className="text-stone-400">—</span>}
                        </td>
                        <td className={calcTd}>{formatCurrency(row.grossSalary)}</td>
                        <td className={`${calcTd} font-semibold text-violet-900`}>{formatCurrency(row.rowTotal)}</td>
                        <td colSpan={3} className="border-b border-stone-200 bg-violet-50/20 px-4 py-3 text-xs text-violet-400 text-center">
                          Rol fijo — no entra en comparación de equipo
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} className={`${totalTd} text-right`}>Subtotal Gestión operativa</td>
                      <td className={`${totalTd} font-bold text-violet-700`}>{formatCurrency(mgmtTotal)}</td>
                      <td colSpan={3} className={totalTd} />
                    </tr>
                  </Fragment>
                );
              })()}

              {PAYROLL_CATEGORY_ORDER.map((cat) => {
                const catRows = summary.rows.filter((r) => r.category === cat && !MANAGEMENT_ROLE_IDS.has(r.roleId));
                if (catRows.length === 0) return null;
                const catTotal = catRows.reduce((s, r) => s + r.rowTotal, 0);

                return (
                  <Fragment key={cat}>
                    {/* Section header */}
                    <tr>
                      <td colSpan={9} className={sectionTd}>
                        {CATEGORY_LABELS[cat]}
                      </td>
                    </tr>

                    {/* Data rows */}
                    {catRows.map((row) => {
                      const matchesSuggested = row.suggestedQty === row.quantity;
                      const deltaQty  = row.qtyDelta;   // + = need more, − = over-hired
                      const deltaCost = row.costDelta;

                      return (
                        <tr key={row.roleId} className="group hover:bg-amber-50/20">
                          {/* Rol */}
                          <td className={labelTd}>
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className="font-medium text-stone-900">{row.label}</span>
                              {row.isEssential && (
                                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                                  esencial
                                </span>
                              )}
                              {row.dependency === "demanda" && (
                                <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                  demanda
                                </span>
                              )}
                            </div>
                            {row.notes && (
                              <p className="mt-0.5 text-xs text-stone-400">{row.notes}</p>
                            )}
                          </td>

                          {/* Cantidad contratada — editable */}
                          <td className={inputTd}>
                            <input
                              type="number"
                              min={row.isEssential ? 1 : 0}
                              step={1}
                              value={row.quantity}
                              onChange={(e) => updateQty(row.roleId, e.target.value)}
                              className={`${inputCls} text-center`}
                              aria-label={`Cantidad ${row.label}`}
                            />
                          </td>

                          {/* Sueldo neto — editable */}
                          <td className={inputTd}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatCurrency(row.netSalary)}
                              onChange={(e) => updateSalary(row.roleId, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className={`${inputCls} text-right`}
                              aria-label={`Sueldo neto ${row.label}`}
                            />
                          </td>

                          {/* CCSS */}
                          <td className={calcTd}>
                            {row.hasCCSS ? formatCurrency(row.ccss) : <span className="text-stone-400">—</span>}
                          </td>

                          {/* Sueldo bruto */}
                          <td className={calcTd}>{formatCurrency(row.grossSalary)}</td>

                          {/* Costo contratado (qty × gross) */}
                          <td className={`${calcTd} font-semibold text-stone-900`}>
                            {formatCurrency(row.rowTotal)}
                          </td>

                          {/* Sugerido */}
                          <td className="border-b border-r border-stone-200 bg-white px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                row.suggestedQty === 0
                                  ? "bg-stone-100 text-stone-400"
                                  : matchesSuggested
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {row.suggestedQty}
                              {matchesSuggested && row.suggestedQty > 0 && (
                                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                          </td>

                          {/* Δ Personas */}
                          <td className="border-b border-r border-stone-200 bg-white px-4 py-3 text-center text-sm font-semibold tabular-nums">
                            {deltaQty === 0 ? (
                              <span className="text-stone-300">—</span>
                            ) : (
                              <span className={deltaQty > 0 ? "text-amber-600" : "text-sky-600"}>
                                {deltaQty > 0 ? `+${deltaQty}` : deltaQty}
                              </span>
                            )}
                          </td>

                          {/* Δ Costo */}
                          <td className="border-b border-stone-200 bg-white px-4 py-3 text-right text-sm font-semibold tabular-nums">
                            {deltaCost === 0 ? (
                              <span className="text-stone-300">—</span>
                            ) : (
                              <span className={deltaCost > 0 ? "text-amber-600" : "text-sky-600"}>
                                {deltaCost > 0 ? "+" : ""}
                                {formatCurrency(deltaCost)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Subtotal row */}
                    <tr>
                      <td colSpan={5} className={`${totalTd} text-right`}>
                        Subtotal {CATEGORY_LABELS[cat]}
                      </td>
                      <td className={`${totalTd} font-bold text-stone-800`}>
                        {formatCurrency(catTotal)}
                      </td>
                      <td colSpan={3} className={totalTd} />
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td className={`${footTd} text-left text-xs uppercase tracking-wide`}>
                  Costo de equipo
                </td>
                <td className={`${footTd} text-center`}>{summary.contractedHeadcount}</td>
                <td colSpan={2} className={footTd} />
                <td className={footTd} />
                <td className={footTd}>{formatCurrency(summary.equipoSubtotal)}</td>
                <td className={`${footTd} text-center`}>{summary.suggestedHeadcount}</td>
                <td className={`${footTd} text-center font-bold ${summary.headcountGap > 0 ? "text-amber-300" : summary.headcountGap < 0 ? "text-sky-300" : ""}`}>
                  {summary.headcountGap === 0 ? "=" : summary.headcountGap > 0 ? `+${summary.headcountGap}` : summary.headcountGap}
                </td>
                <td className={`${footTd} font-bold ${summary.payrollGap > 0 ? "text-amber-300" : summary.payrollGap < 0 ? "text-sky-300" : ""}`}>
                  {summary.payrollGap === 0 ? "—" : (summary.payrollGap > 0 ? "+" : "") + formatCurrency(summary.payrollGap)}
                </td>
              </tr>
              <tr>
                <td className={`${footTd} text-left text-xs uppercase tracking-wide opacity-70`}>
                  + Gestión operativa
                </td>
                <td colSpan={4} className={`${footTd} opacity-70`} />
                <td className={`${footTd} opacity-70`}>{formatCurrency(summary.managementSubtotal)}</td>
                <td colSpan={3} className={`${footTd} text-xs opacity-50`}>
                  {summary.managementToRevenuePercent.toFixed(1)}% facturación
                </td>
              </tr>
              <tr>
                <td className={`${footTd} text-left text-xs font-extrabold uppercase tracking-wide`}>
                  Total nómina
                </td>
                <td colSpan={4} className={footTd} />
                <td className={`${footTd} font-extrabold`}>{formatCurrency(summary.totalPayroll)}</td>
                <td colSpan={3} className={`${footTd} text-xs`}>
                  {summary.payrollToRevenuePercent.toFixed(1)}% facturación
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ── Distribución por área ─────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-3">
        {(
          [
            { label: "Dirección / Administración", value: summary.direccionSubtotal },
            { label: "Salón", value: summary.fohSubtotal },
            { label: "Cocina", value: summary.bohSubtotal },
          ] as const
        ).map((item) => {
          const pct =
            summary.totalPayroll > 0 ? (item.value / summary.totalPayroll) * 100 : 0;
          return (
            <div
              key={item.label}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-bold text-stone-900">
                  {formatCurrency(item.value)}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {pct.toFixed(1)}% del total
                </p>
              </div>
              <div className="h-2 w-full bg-stone-100">
                <div
                  className="h-full bg-violet-600 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Análisis de cocina ────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-700 bg-slate-800 px-5 py-3.5">
          <p className="text-sm font-semibold text-white">
            Análisis de cocina — elasticidad y demanda
          </p>
          <p className="mt-0.5 text-xs text-slate-300">
            Cubiertos: {formatCovers(params.monthlyCovers)} · Los roles con demanda se activan según umbrales mínimos
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                {[
                  ["Rol", "text-left"],
                  ["Dependencia", "text-left"],
                  ["Elasticidad", "text-left"],
                  ["Umbral activación", "text-left"],
                  ["Cub / persona", "text-right"],
                  ["Cantidad sugerida", "text-center"],
                  ["Estado", "text-left"],
                ].map(([h, align]) => (
                  <th
                    key={h}
                    className={`border-b border-r border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 last:border-r-0 ${align}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.rows
                .filter((r) => r.category === "boh")
                .map((row) => {
                  const sugg = suggested[row.roleId] ?? row.quantity;
                  const active = sugg > 0;

                  const elastBadge = {
                    alta: "bg-sky-100 text-sky-700",
                    media: "bg-amber-100 text-amber-700",
                    baja: "bg-orange-100 text-orange-700",
                    ninguna: "bg-violet-100 text-violet-700",
                  }[row.elasticity];

                  return (
                    <tr
                      key={row.roleId}
                      className={active ? "bg-white" : "bg-stone-50 opacity-60"}
                    >
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-sm font-medium text-stone-900">
                        {row.label}
                        {row.isEssential && (
                          <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                            esencial
                          </span>
                        )}
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.dependency === "fijo"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {row.dependency}
                        </span>
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${elastBadge}`}>
                          {row.elasticity}
                        </span>
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-sm text-stone-500">
                        {row.kitchenCoversThreshold
                          ? `≥ ${formatCovers(row.kitchenCoversThreshold)} cub/mes`
                          : "—"}
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-right text-sm tabular-nums text-stone-600">
                        {row.kitchenCoversPerPerson
                          ? `${formatCovers(row.kitchenCoversPerPerson)}`
                          : "—"}
                      </td>
                      <td className="border-b border-r border-slate-200 px-4 py-3 text-center text-sm font-bold text-stone-900">
                        {sugg}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            !active
                              ? "bg-stone-100 text-stone-500"
                              : row.isEssential
                                ? "bg-violet-100 text-violet-800"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {!active
                            ? "Inactivo"
                            : row.isEssential
                              ? "Siempre activo"
                              : "Activo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-500">
            <strong>Producción AM</strong>: 1 persona fija desde la apertura, independientemente de la demanda.{" "}
            <strong>Ayudante de cocina AM/PM (despacho)</strong>: se activan según el pico de cubiertos.{" "}
            <strong>Baja</strong>: requieren especialización, difíciles de reemplazar.{" "}
            <strong>Alta</strong>: escalan con el volumen.
          </p>
        </div>
      </section>

      {/* ── Refuerzos ─────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50 px-5 py-3">
          <p className="text-sm font-semibold text-stone-700">
            Refuerzos eventuales — valor por turno de 4 hs
          </p>
        </div>
        <div className="flex flex-wrap gap-4 px-5 py-4">
          {refuerzos.map((r) => (
            <div
              key={r.label}
              className="rounded-lg border border-stone-100 bg-stone-50 px-5 py-3"
            >
              <p className="text-xs font-medium text-stone-500">{r.label}</p>
              <p className="mt-1 text-lg font-bold text-stone-900">
                {formatCurrency(r.valor4hs)}
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
