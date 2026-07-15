"use client";

import { useMemo } from "react";
import KpiCard from "@/components/ui/KpiCard";
import PageLayout from "@/components/ui/PageLayout";
import SectionCard from "@/components/ui/SectionCard";
import {
  calculateCashflow,
  type CashflowMonthResult,
  type CashflowParams,
} from "@/lib/cashflow";
import { buildOperationalCashflowMonths } from "@/lib/cashflow/operational-bridge";
import {
  compactCurrency,
  formatCovers,
  formatCurrency,
  formatPercent,
  parseCurrency,
  parseNumber,
} from "@/lib/format";
import CashflowExcelView from "@/components/CashflowExcelView";
import { useOperationalYear } from "@/lib/operational-year/OperationalYearProvider";

type CashflowDashboardProps = {
  cashflowParams: CashflowParams;
  setCashflowParams: React.Dispatch<React.SetStateAction<CashflowParams>>;
};

type ParamRow =
  | { kind: "percent"; label: string; key: keyof CashflowParams }
  | { kind: "currency"; label: string; key: keyof CashflowParams };

function ParamTable({
  title,
  rows,
  params,
  onChangePercent,
  onChangeCurrency,
}: {
  title: string;
  rows: ParamRow[];
  params: CashflowParams;
  onChangePercent: (key: keyof CashflowParams, value: number) => void;
  onChangeCurrency: (key: keyof CashflowParams, value: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              colSpan={2}
              className="border-b border-violet-300 bg-violet-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-violet-900"
            >
              {title}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const value = params[row.key] as number;
            return (
              <tr key={row.key as string}>
                <td className="border-b border-r border-stone-200 px-3 py-2 text-sm text-stone-700">
                  {row.label}
                </td>
                <td className="border-b border-stone-200 bg-amber-50 p-0">
                  {row.kind === "percent" ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={Number((value * 100).toFixed(2))}
                        onChange={(event) => {
                          const parsed = parseNumber(event.target.value);
                          if (parsed !== null) onChangePercent(row.key, parsed / 100);
                        }}
                        className="w-full border-0 bg-transparent px-3 py-2 text-right text-sm font-semibold tabular-nums text-stone-900 outline-none focus:bg-amber-100"
                      />
                      <span className="pr-2 text-xs text-stone-400">%</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(value)}
                      onFocus={(event) => event.target.select()}
                      onChange={(event) => {
                        const parsed = parseCurrency(event.target.value);
                        if (parsed !== null) onChangeCurrency(row.key, parsed);
                      }}
                      className="w-full border-0 bg-transparent px-3 py-2 text-right text-sm font-semibold tabular-nums text-stone-900 outline-none focus:bg-amber-100"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type ComputedRow = {
  kind: "computed";
  label: string;
  value: (month: CashflowMonthResult) => number;
  formatter?: (value: number) => string;
  emphasis?: "result" | "subtle" | "negative";
};

type LinkedRow = {
  kind: "linked";
  label: string;
  field: "covers" | "ticket" | "payroll";
  formatter: (value: number) => string;
};

type Row = ComputedRow | LinkedRow;

export default function CashflowDashboard({
  cashflowParams,
  setCashflowParams,
}: CashflowDashboardProps) {
  const operationalState = useOperationalYear();

  const operationalMonths = useMemo(
    () => buildOperationalCashflowMonths(operationalState),
    [operationalState],
  );

  const summary = useMemo(
    () => calculateCashflow(cashflowParams, operationalMonths),
    [cashflowParams, operationalMonths],
  );

  const months = summary.months;
  const ebitdaMargin =
    summary.yearSales > 0 ? summary.yearOperatingResult / summary.yearSales : 0;
  const netMargin =
    summary.yearSales > 0 ? summary.yearNetIncome / summary.yearSales : 0;

  function updateParam<K extends keyof CashflowParams>(key: K, value: CashflowParams[K]) {
    setCashflowParams((prev) => ({ ...prev, [key]: value }));
  }

  const rows: Row[] = [
    { kind: "linked", label: "Cubiertos", field: "covers", formatter: formatCovers },
    { kind: "linked", label: "Ticket promedio", field: "ticket", formatter: formatCurrency },
    { kind: "computed", label: "Ventas", value: (m) => m.sales, emphasis: "result" },
    { kind: "computed", label: "Costos variables", value: (m) => -m.variableCosts, emphasis: "negative" },
    { kind: "computed", label: "Margen bruto", value: (m) => m.grossMargin, emphasis: "subtle" },
    { kind: "linked", label: "Costo operativo", field: "payroll", formatter: formatCurrency },
    { kind: "computed", label: "Costos de estructura", value: (m) => -m.structureCosts, emphasis: "negative" },
    { kind: "computed", label: "Resultado operativo", value: (m) => m.operatingResult, emphasis: "result" },
    { kind: "computed", label: "Costo de gestión", value: (m) => -m.managementCost, emphasis: "negative" },
    { kind: "computed", label: "Impuesto a las ganancias", value: (m) => -m.incomeTax, emphasis: "negative" },
    { kind: "computed", label: "Resultado neto", value: (m) => m.netIncome, emphasis: "result" },
    { kind: "computed", label: "Reserva de despidos", value: (m) => m.layoffReserve, emphasis: "subtle" },
  ];

  function yearTotal(row: Row): number {
    if (row.kind === "linked") {
      if (row.field === "ticket") {
        return summary.yearCovers > 0 ? summary.yearSales / summary.yearCovers : 0;
      }
      return months.reduce((total, month) => total + month[row.field], 0);
    }
    return months.reduce((total, month) => total + row.value(month), 0);
  }

  const labelCell =
    "sticky left-0 z-10 border-b border-r border-stone-200 bg-white px-3 py-2.5 text-left text-sm";
  const totalCell =
    "border-b border-r border-stone-200 bg-stone-100 px-3 py-2.5 text-right text-sm tabular-nums";
  const monthCell =
    "border-b border-r border-stone-200 px-2 py-2.5 text-right text-sm tabular-nums last:border-r-0";

  function emphasisClass(emphasis?: ComputedRow["emphasis"]): string {
    if (emphasis === "result") return "font-bold text-stone-900";
    if (emphasis === "negative") return "text-rose-600";
    if (emphasis === "subtle") return "font-semibold text-stone-700";
    return "text-stone-700";
  }

  const variableRows: ParamRow[] = [
    { kind: "percent", label: "CMV", key: "cmvPct" },
    { kind: "percent", label: "Costo delivery", key: "deliveryPct" },
    { kind: "percent", label: "Gastos adición", key: "additionalFeePct" },
    { kind: "percent", label: "Comisiones / impuestos", key: "commissionTaxPct" },
    { kind: "percent", label: "Reinversión", key: "reinvestmentPct" },
  ];

  const structureRows: ParamRow[] = [
    { kind: "currency", label: "Costo locativo", key: "rent" },
    { kind: "currency", label: "Servicios públicos", key: "utilities" },
    { kind: "currency", label: "Marketing", key: "marketing" },
    { kind: "currency", label: "Gastos operativos", key: "operatingExpenses" },
    { kind: "currency", label: "Honorarios", key: "honorarios" },
    { kind: "currency", label: "Mantenimiento", key: "maintenance" },
    { kind: "currency", label: "Bazar", key: "bazar" },
  ];

  const managementRows: ParamRow[] = [
    { kind: "percent", label: "IIGG", key: "incomeTaxPct" },
    { kind: "percent", label: "Reserva despidos", key: "layoffReservePct" },
  ];

  const variableShare =
    summary.yearSales > 0 ? summary.yearVariableCosts / summary.yearSales : 0;
  const fixedShare =
    summary.yearSales > 0 ? summary.yearFixedCosts / summary.yearSales : 0;

  return (
    <PageLayout className="space-y-6">
      <CashflowExcelView />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas año 1"
          value={formatCurrency(summary.yearSales)}
          hint={`${formatCovers(summary.yearCovers)} cubiertos`}
          tone="violet"
        />
        <KpiCard
          label="EBITDA año 1"
          value={formatCurrency(summary.yearOperatingResult)}
          hint={`${formatPercent(ebitdaMargin)} sobre ventas`}
          tone={summary.yearOperatingResult >= 0 ? "emerald" : "amber"}
        />
        <KpiCard
          label="Costo de gestión año 1"
          value={formatCurrency(summary.yearManagementCost)}
        />
        <KpiCard
          label="Resultado neto año 1"
          value={formatCurrency(summary.yearNetIncome)}
          hint={`${formatPercent(netMargin)} sobre ventas`}
          tone={summary.yearNetIncome >= 0 ? "emerald" : "amber"}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-stone-900">Incidencia sobre ventas</h2>
        </div>
        <div className="grid divide-y divide-stone-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Costos variables / ventas
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{formatPercent(variableShare)}</p>
            <p className="mt-0.5 text-xs text-stone-400">{formatCurrency(summary.yearVariableCosts)} / año</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Costos fijos / ventas
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{formatPercent(fixedShare)}</p>
            <p className="mt-0.5 text-xs text-stone-400">{formatCurrency(summary.yearFixedCosts)} / año</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Costos totales / ventas
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-800">
              {formatPercent(variableShare + fixedShare)}
            </p>
            <p className="mt-0.5 text-xs text-stone-400">
              {formatCurrency(summary.yearVariableCosts + summary.yearFixedCosts)} / año
            </p>
          </div>
        </div>
      </section>

      <SectionCard
        title="Estado de resultados — Hub operativo"
        subtitle="Modelo calculado en la app. Cubiertos, ticket, ventas y nóminas vienen de Facturación + RRHH por mes."
        tone="cashflow"
        className="rounded-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[180px]" />
              <col className="w-[84px]" />
              {months.map((month) => (
                <col key={month.month} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-r border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-violet-900">
                  Concepto
                </th>
                <th className="border-b border-r border-violet-300 bg-violet-100 px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-violet-900">
                  Año
                </th>
                {months.map((month) => (
                  <th
                    key={month.month}
                    className="border-b border-r border-violet-300 bg-violet-100 px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-violet-900 last:border-r-0"
                  >
                    {month.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = yearTotal(row);

                return (
                  <tr key={row.label}>
                    <th
                      className={`${labelCell} ${
                        row.kind === "computed"
                          ? emphasisClass(row.emphasis)
                          : "font-medium text-violet-900"
                      }`}
                    >
                      {row.label}
                    </th>
                    <td
                      className={`${totalCell} ${
                        row.kind === "computed"
                          ? emphasisClass(row.emphasis)
                          : "font-semibold text-violet-800"
                      }`}
                      title={
                        row.kind === "linked"
                          ? row.formatter(total)
                          : formatCurrency(total)
                      }
                    >
                      {row.kind === "linked" && row.field === "covers"
                        ? row.formatter(total)
                        : compactCurrency(total)}
                    </td>
                    {months.map((month) =>
                      row.kind === "linked" ? (
                        <td
                          key={month.month}
                          className={`${monthCell} bg-violet-50 font-medium text-violet-900`}
                          title={row.formatter(month[row.field])}
                        >
                          {row.field === "covers"
                            ? row.formatter(month[row.field])
                            : compactCurrency(month[row.field])}
                        </td>
                      ) : (
                        <td
                          key={month.month}
                          className={`${monthCell} ${emphasisClass(row.emphasis)}`}
                          title={(row.formatter ?? formatCurrency)(row.value(month))}
                        >
                          {compactCurrency(row.value(month))}
                        </td>
                      ),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-stone-100 px-5 py-2 text-[11px] text-stone-400">
          Valores en millones (M) y miles (k). Pasá el cursor sobre cada celda para ver el monto exacto.
        </p>
      </SectionCard>

      <SectionCard
        title="Parámetros del modelo"
        subtitle="Editá las celdas amarillas para recalcular todo el año."
        tone="cashflow"
        className="rounded-2xl"
      >
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <ParamTable
            title="Costos variables (% sobre ventas)"
            rows={variableRows}
            params={cashflowParams}
            onChangePercent={updateParam}
            onChangeCurrency={updateParam}
          />
          <ParamTable
            title="Costos de estructura (fijos mensuales)"
            rows={structureRows}
            params={cashflowParams}
            onChangePercent={updateParam}
            onChangeCurrency={updateParam}
          />
          <ParamTable
            title="Impuestos y reservas (variables)"
            rows={managementRows}
            params={cashflowParams}
            onChangePercent={updateParam}
            onChangeCurrency={updateParam}
          />
        </div>
      </SectionCard>
    </PageLayout>
  );
}
