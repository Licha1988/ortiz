import type { DashboardParams, TicketMatrix, TimeSlot } from "./types";
import { DAYS, TIME_SLOTS } from "./types";

export const WEEKS_PER_MONTH = 52 / 12;

function createUniformTickets(value: number): TicketMatrix[TimeSlot] {
  return DAYS.reduce(
    (acc, day) => {
      acc[day] = value;
      return acc;
    },
    {} as TicketMatrix[TimeSlot],
  );
}

function createTicketMatrix(): TicketMatrix {
  const weekend = new Set<(typeof DAYS)[number]>(["sábado", "domingo"]);

  return {
    desayuno: createUniformTickets(15000),
    almuerzo: DAYS.reduce(
      (acc, day) => {
        acc[day] = weekend.has(day) ? 29000 : 27000;
        return acc;
      },
      {} as TicketMatrix["almuerzo"],
    ),
    merienda: DAYS.reduce(
      (acc, day) => {
        acc[day] = weekend.has(day) ? 19000 : 16000;
        return acc;
      },
      {} as TicketMatrix["merienda"],
    ),
    cena: DAYS.reduce(
      (acc, day) => {
        acc[day] = day === "viernes" || day === "sábado" ? 42000 : 35000;
        return acc;
      },
      {} as TicketMatrix["cena"],
    ),
  };
}

export const DEFAULT_PARAMS: DashboardParams = {
  monthlyCovers: 4000,
  dayPercentages: {
    lunes: 10,
    martes: 10,
    miércoles: 12,
    jueves: 14,
    viernes: 18,
    sábado: 20,
    domingo: 16,
  },
  slotPercentages: {
    desayuno: 15,
    almuerzo: 35,
    merienda: 10,
    cena: 40,
  },
  ticketMatrix: createTicketMatrix(),
};
