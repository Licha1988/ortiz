"use client";

import { formatCurrency } from "@/lib/format";
import { payrollHealthColor } from "@/lib/payroll/calculations";
import type { PayrollSummary } from "@/lib/payroll/types";
import type { DashboardParams } from "@/lib/types";

type HrOperationalKpisProps = {
  params: DashboardParams;
  monthlyRevenue: number;
  summary: PayrollSummary;
  onMonthlyCoversChange: (value: string) => void;
};

export default function HrOperationalKpis({
  params,
  monthlyRevenue,
  summary,
  onMonthlyCoversChange,
}: HrOperationalKpisProps) {
  const operativoHealth = payrollHealthColor(summary.equipoToRevenuePercent);

  return (
    <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <div className="border-b border-violet-100 bg-violet-800 px-5 py-3.5">
        <p className="text-sm font-semibold text-white">Parámetros operativos</p>
        <p className="mt-0.5 text-xs text-violet-200">
          Plantilla mensual + eventuales diarios del mes activo
        </p>
      </div>

      <div className="flex flex-wrap items-stretch gap-0 divide-x divide-stone-100">
        <div className="min-w-[200px] flex-1 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
            Cubiertos mensuales
          </p>
          <input
            type="number"
            min={0}
            step={100}
            value={params.monthlyCovers}
            onChange={(e) => onMonthlyCoversChange(e.target.value)}
            className="mt-2 w-full max-w-[180px] rounded-lg border border-violet-300 bg-amber-50 px-3 py-2 text-lg font-semibold text-stone-900 outline-none focus:border-violet-500 focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/30"
          />
        </div>

        <div className="min-w-[180px] flex-1 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Facturación mensual
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-900">
            {formatCurrency(monthlyRevenue)}
          </p>
        </div>

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

        <div className="min-w-[120px] flex-1 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Equipo contratado
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-900">
            {summary.contractedHeadcount}
          </p>
        </div>
      </div>

      <div className="grid gap-0 border-t border-stone-100 sm:grid-cols-3">
        <div className="border-b border-stone-100 bg-violet-50 px-5 py-4 sm:border-b-0 sm:border-r">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Costo de gestión
          </p>
          <p className="mt-1 text-xs text-violet-500">Lisandro + Bruno Bonnano</p>
          <p className="mt-2 text-2xl font-bold text-violet-800">
            {formatCurrency(summary.managementSubtotal)}
          </p>
          <p className="mt-1 text-sm font-semibold text-violet-600">
            {summary.managementToRevenuePercent.toFixed(1)}%
            <span className="ml-1 text-xs font-normal text-violet-400">de la facturación</span>
          </p>
        </div>

        <div className={`border-b border-stone-100 px-5 py-4 sm:border-b-0 sm:border-r ${operativoHealth.bg}`}>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${operativoHealth.text} opacity-80`}
          >
            Costo operativo
          </p>
          <p className={`mt-1 text-xs ${operativoHealth.text} opacity-60`}>
            Nómina mensual + eventuales diarios
          </p>
          <p className={`mt-2 text-2xl font-bold ${operativoHealth.text}`}>
            {formatCurrency(summary.equipoSubtotal)}
          </p>
          <p className={`mt-1 text-sm font-semibold ${operativoHealth.text}`}>
            {summary.equipoToRevenuePercent.toFixed(1)}%
            <span className={`ml-1 text-xs font-normal ${operativoHealth.text} opacity-70`}>
              de la facturación · {operativoHealth.label}
            </span>
          </p>
        </div>

        <div className="bg-amber-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Costo de eventuales
          </p>
          <p className="mt-1 text-xs text-amber-700">Contratación diaria del mes</p>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            {formatCurrency(summary.eventualesSubtotal)}
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-800">
            {summary.eventualesToRevenuePercent.toFixed(1)}%
            <span className="ml-1 text-xs font-normal text-amber-700">de la facturación</span>
          </p>
        </div>
      </div>

      <div className="grid gap-0 border-t border-stone-200 bg-stone-50 sm:grid-cols-4">
        <div className="border-b border-stone-200 px-5 py-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            Gestión
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-violet-900">
            {formatCurrency(summary.managementSubtotal)}
          </p>
        </div>
        <div className="border-b border-stone-200 px-5 py-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">
            Nómina mensual
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-stone-900">
            {formatCurrency(summary.nominaOperativaSubtotal)}
          </p>
          <p className="text-xs text-stone-600">
            {summary.nominaOperativaToRevenuePercent.toFixed(1)}% facturación
          </p>
        </div>
        <div className="border-b border-stone-200 px-5 py-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Eventuales
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-amber-900">
            {formatCurrency(summary.eventualesSubtotal)}
          </p>
          <p className="text-xs text-amber-700">
            {summary.eventualesToRevenuePercent.toFixed(1)}% facturación
          </p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">
            Total consolidado
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-stone-900">
            {formatCurrency(summary.totalPayroll)}
          </p>
          <p className="text-xs text-stone-600">
            {summary.payrollToRevenuePercent.toFixed(1)}% facturación
          </p>
        </div>
      </div>
    </section>
  );
}
