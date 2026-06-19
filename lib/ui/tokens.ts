/** Paleta semántica por contexto de pestaña/sección. */
export const sectionHeaders = {
  operational: "bg-violet-800 text-white",
  staffing: "bg-slate-800 text-white",
  payroll: "bg-violet-800 text-white",
  cashflow: "bg-violet-800 text-white",
} as const;

export const shiftHeaders = {
  am: "bg-sky-800 text-white",
  pm: "bg-indigo-800 text-white",
  fixed: "bg-stone-700 text-white",
} as const;

/** Input editable estándar (celda amarilla). */
export const editableInput =
  "border border-stone-300 bg-amber-50 text-stone-900 outline-none transition focus:border-violet-500 focus:bg-amber-100 focus:ring-2 focus:ring-violet-400/30";

export const editableCellInput =
  "w-full border-0 bg-transparent text-stone-900 outline-none focus:bg-amber-100";

/** Semáforo nómina / ventas (% sobre facturación). */
export function healthTone(percent: number): "emerald" | "amber" | "red" {
  if (percent <= 30) return "emerald";
  if (percent <= 40) return "amber";
  return "red";
}

export const healthClasses = {
  emerald: { bg: "bg-emerald-600", text: "text-white", label: "Saludable" },
  amber: { bg: "bg-amber-500", text: "text-white", label: "Atención" },
  red: { bg: "bg-red-600", text: "text-white", label: "Crítico" },
} as const;
