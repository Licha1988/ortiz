/** Año operativo Casa Ortiz: AGO 2026 → JUL 2027. */
export const OPERATIONAL_YEAR_CATALOG = [
  { key: "2026-08", label: "AGO 2026", year: 2026, month: 8 },
  { key: "2026-09", label: "SEP 2026", year: 2026, month: 9 },
  { key: "2026-10", label: "OCT 2026", year: 2026, month: 10 },
  { key: "2026-11", label: "NOV 2026", year: 2026, month: 11 },
  { key: "2026-12", label: "DIC 2026", year: 2026, month: 12 },
  { key: "2027-01", label: "ENE 2027", year: 2027, month: 1 },
  { key: "2027-02", label: "FEB 2027", year: 2027, month: 2 },
  { key: "2027-03", label: "MAR 2027", year: 2027, month: 3 },
  { key: "2027-04", label: "ABR 2027", year: 2027, month: 4 },
  { key: "2027-05", label: "MAY 2027", year: 2027, month: 5 },
  { key: "2027-06", label: "JUN 2027", year: 2027, month: 6 },
  { key: "2027-07", label: "JUL 2027", year: 2027, month: 7 },
] as const;

export type OperationalMonthKey = (typeof OPERATIONAL_YEAR_CATALOG)[number]["key"];

export const OPERATIONAL_MONTH_KEYS = OPERATIONAL_YEAR_CATALOG.map(
  (entry) => entry.key,
) as OperationalMonthKey[];

export const DEFAULT_OPERATIONAL_MONTH_KEY = OPERATIONAL_YEAR_CATALOG[0].key;

export function getOperationalMonthEntry(key: OperationalMonthKey) {
  const entry = OPERATIONAL_YEAR_CATALOG.find((item) => item.key === key);
  if (!entry) {
    throw new Error(`Mes operativo desconocido: ${key}`);
  }
  return entry;
}

const SPANISH_MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Nombre del mes en español con mayúscula inicial (ej. "Agosto"). */
export function getOperationalMonthName(month: number): string {
  const name = SPANISH_MONTH_NAMES[month - 1];
  if (!name) throw new Error(`Mes inválido: ${month}`);
  return name.charAt(0).toUpperCase() + name.slice(1);
}
