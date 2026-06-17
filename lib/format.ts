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

import type { Day } from "./types";

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
