import { CCSS_RATE } from "@/lib/config";
import type { PayrollEntry } from "@/lib/payroll/types";

export function resolveCcssRate(entry: Pick<PayrollEntry, "hasCCSS" | "ccssRate">): number {
  if (typeof entry.ccssRate === "number") {
    return Math.max(0, Math.min(1, entry.ccssRate));
  }
  return entry.hasCCSS ? CCSS_RATE : 0;
}

export function resolveCcssPercent(entry: Pick<PayrollEntry, "hasCCSS" | "ccssRate">): number {
  return Math.round(resolveCcssRate(entry) * 1000) / 10;
}

export function computeEntryCcss(entry: Pick<PayrollEntry, "netSalary" | "hasCCSS" | "ccssRate">): number {
  return Math.round(entry.netSalary * resolveCcssRate(entry));
}

export function computeEntryGross(entry: Pick<PayrollEntry, "netSalary" | "hasCCSS" | "ccssRate">): number {
  return entry.netSalary + computeEntryCcss(entry);
}

export function ccssRateFromPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent)) / 100;
}
