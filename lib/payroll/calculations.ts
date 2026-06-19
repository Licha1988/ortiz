import { computeEntryCcss, computeEntryGross } from "./ccss";
import type {
  PayrollEntry,
  PayrollRowComputed,
} from "./types";

export function computeRow(entry: PayrollEntry): PayrollRowComputed {
  const ccss = computeEntryCcss(entry);
  const grossSalary = computeEntryGross(entry);
  const rowTotal = grossSalary * entry.quantity;
  return {
    ...entry,
    ccss,
    grossSalary,
    rowTotal,
  };
}

export function payrollHealthColor(percent: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (percent <= 30) return { bg: "bg-emerald-600", text: "text-white", label: "Saludable" };
  if (percent <= 40) return { bg: "bg-amber-500", text: "text-white", label: "Atención" };
  return { bg: "bg-red-600", text: "text-white", label: "Crítico" };
}
