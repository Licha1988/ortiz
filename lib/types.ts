export const DAYS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export const TIME_SLOTS = [
  "desayuno",
  "almuerzo",
  "merienda",
  "cena",
] as const;

export type Day = (typeof DAYS)[number];
export type TimeSlot = (typeof TIME_SLOTS)[number];

export type DayPercentages = Record<Day, number>;
export type SlotPercentages = Record<TimeSlot, number>;
export type TicketMatrix = Record<TimeSlot, Record<Day, number>>;

export type DashboardParams = {
  monthlyCovers: number;
  dayPercentages: DayPercentages;
  slotPercentages: SlotPercentages;
  ticketMatrix: TicketMatrix;
};

export type CoversMatrix = Record<TimeSlot, Record<Day, number>>;
export type RevenueMatrix = Record<TimeSlot, Record<Day, number>>;

export type DashboardResults = {
  weeklyCovers: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  weightedAvgTicket: number;
  ticketAverageBySlot: Record<TimeSlot, number>;
  coversByDay: Record<Day, number>;
  revenueByDay: Record<Day, number>;
  revenueBySlotWeekly: Record<TimeSlot, number>;
  revenueBySlotMonthly: Record<TimeSlot, number>;
  coversBySlotWeekly: Record<TimeSlot, number>;
  coversMatrix: CoversMatrix;
  revenueMatrix: RevenueMatrix;
  slotTotals: Record<TimeSlot, number>;
  dayTotals: Record<Day, number>;
  weeklyCoversTotal: number;
};
