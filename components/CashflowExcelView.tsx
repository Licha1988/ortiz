"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";
import {
  findEerrRow,
  formatEerrCellTitle,
  formatEerrCellValue,
  parseEerrExcelFromBuffer,
  type ParsedEerrExcel,
} from "@/lib/cashflow/parse-eerr-excel";
import { formatCurrency, formatPercent } from "@/lib/format";

function rowYearDisplay(row: ParsedEerrExcel["rows"][number]): string {
  if (row.yearTotal === null) return "—";
  return formatEerrCellValue(row.yearTotal, row.valueKind);
}

function rowYearTitle(row: ParsedEerrExcel["rows"][number]): string {
  if (row.yearTotal === null) return "";
  return formatEerrCellTitle(row.yearTotal, row.valueKind);
}

function emphasisClass(emphasis?: ParsedEerrExcel["rows"][number]["emphasis"]): string {
  if (emphasis === "result") return "font-bold text-stone-900";
  if (emphasis === "negative") return "font-semibold text-rose-700";
  if (emphasis === "section") return "font-semibold text-violet-950";
  if (emphasis === "subtle") return "font-medium text-stone-700";
  return "text-stone-700";
}

export default function CashflowExcelView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedEerrExcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setError("Subí un archivo Excel (.xlsx).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseEerrExcelFromBuffer(buffer, file.name);
      if (result.rows.length === 0) {
        throw new Error("No se encontraron filas del EERR para el año 1.");
      }
      setParsed(result);
    } catch (caught) {
      setParsed(null);
      setError(caught instanceof Error ? caught.message : "No se pudo leer el archivo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void processFile(file);
      event.target.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const kpis = useMemo(() => {
    if (!parsed) return null;

    const salesRow = findEerrRow(parsed, (label) => label === "ventas");
    const ebitdaRow = findEerrRow(parsed, (label) => label === "ebitda");
    const netRow = findEerrRow(parsed, (label) => label.includes("resultado neto"));
    const marginRow = findEerrRow(parsed, (label) => label.includes("margen bruto"));

    const yearSales = salesRow?.yearTotal ?? 0;
    const yearEbitda = ebitdaRow?.yearTotal ?? 0;
    const yearNet = netRow?.yearTotal ?? 0;
    const ebitdaMargin = yearSales > 0 ? yearEbitda / yearSales : 0;
    const netMargin = yearSales > 0 ? yearNet / yearSales : 0;

    return {
      yearSales,
      yearEbitda,
      yearNet,
      ebitdaMargin,
      netMargin,
      grossMargin: marginRow?.yearTotal ?? null,
    };
  }, [parsed]);

  const labelCell =
    "sticky left-0 z-10 border-b border-r border-stone-200 bg-white px-3 py-2.5 text-left text-sm";
  const totalCell =
    "border-b border-r border-stone-200 bg-stone-100 px-3 py-2.5 text-right text-sm tabular-nums";
  const monthCell =
    "border-b border-r border-stone-200 px-2 py-2.5 text-right text-sm tabular-nums last:border-r-0";

  return (
    <div className="space-y-6">
      <SectionCard
        title="Modelo Excel — EERR Año 1"
        subtitle={
          parsed
            ? `${parsed.sourceFileName} · hoja «${parsed.sheetName}» · solo lectura`
            : "Importá el archivo de Diego para visualizar el estado de resultados del primer año."
        }
        tone="cashflow"
        className="rounded-2xl"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
        />

        {!parsed && (
          <div
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className={`mx-5 mb-5 mt-4 rounded-2xl border-2 border-dashed px-6 py-10 transition ${
              dragActive
                ? "border-violet-500 bg-violet-50"
                : "border-stone-200 bg-stone-50/80"
            }`}
          >
            {loading ? (
              <EmptyState
                title="Leyendo archivo…"
                description="Estamos parseando la hoja EERR Mensual del Excel."
              />
            ) : (
              <EmptyState
                title="Importar Excel de cashflow"
                description="Arrastrá el .xlsx acá o elegilo desde tu equipo. Usamos la hoja EERR Mensual, columnas Ago–Jul del año 1."
                action={{
                  label: "Elegir archivo",
                  onClick: () => inputRef.current?.click(),
                }}
              />
            )}
            {error && (
              <p className="mt-4 text-center text-sm text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {parsed && kpis && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-3">
              <p className="text-xs text-stone-500">
                Vista espejo del Excel · {parsed.rows.length} conceptos · {parsed.months.length} meses
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full border border-violet-300 bg-white px-4 py-1.5 text-xs font-medium text-violet-900 transition hover:border-violet-500 hover:bg-violet-50"
              >
                Cambiar archivo
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Ventas año 1"
                value={formatCurrency(kpis.yearSales)}
                hint="Desde fila Ventas del Excel"
                tone="violet"
              />
              <KpiCard
                label="EBITDA año 1"
                value={formatCurrency(kpis.yearEbitda)}
                hint={`${formatPercent(kpis.ebitdaMargin)} sobre ventas`}
                tone={kpis.yearEbitda >= 0 ? "emerald" : "amber"}
              />
              <KpiCard
                label="Margen bruto año 1"
                value={formatCurrency(kpis.grossMargin ?? 0)}
                hint="Suma de la fila Margen bruto"
                tone="stone"
              />
              <KpiCard
                label="Resultado neto año 1"
                value={formatCurrency(kpis.yearNet)}
                hint={`${formatPercent(kpis.netMargin)} sobre ventas`}
                tone={kpis.yearNet >= 0 ? "emerald" : "amber"}
              />
            </div>

            {parsed.params.length > 0 && (
              <div className="border-t border-stone-100 px-5 py-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Supuestos del modelo
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {parsed.params.map((param) => (
                    <div
                      key={param.label}
                      className="flex items-baseline justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5"
                    >
                      <span className="text-xs text-stone-600">{param.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-stone-900">
                        {param.displayValue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto border-t border-stone-100">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[220px]" />
                  <col className="w-[88px]" />
                  {parsed.months.map((month) => (
                    <col key={month} />
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
                    {parsed.months.map((month) => (
                      <th
                        key={month}
                        className="border-b border-r border-violet-300 bg-violet-100 px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-violet-900 last:border-r-0"
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row) => (
                    <tr key={row.id}>
                      <th
                        className={`${labelCell} ${emphasisClass(row.emphasis)} ${
                          row.isSubRow ? "pl-6 text-stone-600" : ""
                        } ${row.isSection ? "bg-violet-50/80" : ""}`}
                      >
                        {row.label}
                      </th>
                      <td
                        className={`${totalCell} ${emphasisClass(row.emphasis)}`}
                        title={rowYearTitle(row)}
                      >
                        {rowYearDisplay(row)}
                      </td>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.id}-${parsed.months[index]}`}
                          className={`${monthCell} ${emphasisClass(row.emphasis)} ${
                            row.isSection ? "bg-violet-50/50" : ""
                          }`}
                          title={formatEerrCellTitle(value, row.valueKind)}
                        >
                          {formatEerrCellValue(value, row.valueKind)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-stone-100 px-5 py-2 text-[11px] text-stone-400">
              Valores en millones (M) y miles (k). Pasá el cursor sobre cada celda para ver el monto exacto.
            </p>
          </>
        )}
      </SectionCard>
    </div>
  );
}
