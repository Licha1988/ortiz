/** Estilos de celda reutilizables para tablas de datos. */

export type TableVariant = "violet" | "slate" | "operational";

const variants: Record<
  TableVariant,
  { header: string; label: string; data: string; total: string; grandTotal: string }
> = {
  violet: {
    header:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900",
    label:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-sm font-medium text-violet-900",
    data: "border border-violet-200 bg-white px-3 py-2.5 text-center text-sm tabular-nums text-stone-900",
    total:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-center text-sm font-semibold tabular-nums text-violet-900",
    grandTotal:
      "border border-violet-300 bg-violet-800 px-3 py-2.5 text-center text-sm font-bold tabular-nums text-white",
  },
  slate: {
    header:
      "border border-slate-500 bg-slate-700 px-3 py-2.5 text-xs font-semibold text-white",
    label:
      "border border-slate-300 px-3 py-2.5 text-left text-sm font-medium text-stone-900",
    data: "border border-slate-300 px-3 py-2.5 text-center text-sm tabular-nums text-stone-900",
    total:
      "border border-slate-300 bg-slate-100 px-3 py-2.5 text-center text-sm font-semibold tabular-nums text-stone-900",
    grandTotal:
      "border border-slate-500 bg-slate-800 px-3 py-2.5 text-center text-sm font-bold tabular-nums text-white",
  },
  operational: {
    header:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900",
    label:
      "border border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-sm font-medium text-violet-900",
    data: "border border-violet-200 bg-white px-3 py-2.5 text-center text-sm tabular-nums text-stone-900",
    total:
      "border border-violet-300 bg-violet-200 px-3 py-2.5 text-center text-sm font-semibold tabular-nums text-violet-950",
    grandTotal:
      "border border-violet-300 bg-violet-800 px-3 py-2.5 text-center text-sm font-bold tabular-nums text-white",
  },
};

export function tableStyles(variant: TableVariant = "violet") {
  return variants[variant];
}

/** Tabla de nómina — bordes horizontales (sin cambiar layout existente). */
export const payrollTableStyles = {
  header:
    "border-b border-r border-violet-300 bg-violet-100 px-3 py-2.5 text-xs font-semibold text-violet-900 last:border-r-0",
  section:
    "border-b border-r border-slate-400 bg-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 last:border-r-0",
  label: "border-b border-r border-stone-200 bg-white px-4 py-3 text-sm text-stone-800",
  input: "border-b border-r border-amber-300 bg-amber-50 p-0",
  calc:
    "border-b border-r border-stone-200 bg-white px-4 py-3 text-right text-sm tabular-nums text-stone-600",
  total:
    "border-b border-r border-stone-100 bg-stone-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 last:border-r-0",
  foot:
    "border-r border-violet-400 bg-violet-800 px-4 py-3 text-sm font-bold tabular-nums text-white last:border-r-0",
  inputInner:
    "h-full w-full border-0 bg-transparent px-3 py-3 text-sm tabular-nums text-stone-900 outline-none focus:bg-amber-100",
} as const;

/** Tabla de plantilla — filas densas (StaffRosterTable). */
export const rosterTableStyles = {
  header:
    "border border-slate-500 bg-slate-700 px-2 py-2 text-xs font-semibold text-white whitespace-nowrap",
  body:
    "border border-slate-300 px-2 py-1.5 text-xs text-center whitespace-nowrap text-stone-900",
} as const;

/** Celda de input editable dentro de tabla (fondo amarillo). */
export const tableInputCell =
  "border border-violet-200 bg-amber-50 p-0";

export const tableInputInner =
  "w-full min-w-[5.5rem] border-0 bg-amber-50 px-2 py-2 text-center text-sm tabular-nums text-stone-900 outline-none focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/40 focus:ring-inset";
