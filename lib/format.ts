import type { Day } from "./types";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

const coversFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCovers(value: number): string {
  return coversFormatter.format(value);
}

export const DAY_SHORT: Record<Day, string> = {
  lunes: "LUN",
  martes: "MAR",
  miércoles: "MIÉ",
  jueves: "JUE",
  viernes: "VIE",
  sábado: "SÁB",
  domingo: "DOM",
};

export function dayShort(day: Day): string {
  return DAY_SHORT[day];
}

export function capitalizeDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function capitalizeSlot(slot: string): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

/** Ratio 0–1 → "12.3%" */
export function formatPercent(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/** Formato compacto para tablas densas: $1.2M, $450k */
export function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function parseNumber(value: string): number | null {
  const parsed = Number(value.replace(/\./g, "").replace(/,/g, "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseCurrency(value: string): number | null {
  const parsed = Number(value.replace(/\D/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}
