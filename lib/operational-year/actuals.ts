export type DayActuals = {
  covers?: number;
  revenue?: number;
};

/** Clave = día del mes ("1" … "31"). */
export type MonthActuals = Record<string, DayActuals>;

export function emptyMonthActuals(): MonthActuals {
  return {};
}

export function getDayActual(actuals: MonthActuals, date: number): DayActuals {
  return actuals[String(date)] ?? {};
}

export function setDayActual(
  actuals: MonthActuals,
  date: number,
  patch: Partial<DayActuals>,
): MonthActuals {
  const key = String(date);
  const current = actuals[key] ?? {};
  const next: DayActuals = { ...current };

  if ("covers" in patch) {
    if (patch.covers === undefined) delete next.covers;
    else next.covers = patch.covers;
  }
  if ("revenue" in patch) {
    if (patch.revenue === undefined) delete next.revenue;
    else next.revenue = patch.revenue;
  }

  if (next.covers === undefined && next.revenue === undefined) {
    const { [key]: _, ...rest } = actuals;
    return rest;
  }

  return { ...actuals, [key]: next };
}

export function sumMonthActuals(actuals: MonthActuals): { covers: number; revenue: number } {
  return Object.values(actuals).reduce<{ covers: number; revenue: number }>(
    (acc, day) => ({
      covers: acc.covers + (day.covers ?? 0),
      revenue: acc.revenue + (day.revenue ?? 0),
    }),
    { covers: 0, revenue: 0 },
  );
}
