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
export type DayCounts = Record<Day, number>;

export type OperationalCalendar = {
  year: number;
  /** Mes calendario 1–12 (enero = 1). */
  month: number;
};

export type CalendarDayProjection = {
  date: number;
  weekday: Day;
  covers: number;
  revenue: number;
};

export type WeekdayMonthTotals = Record<Day, { covers: number; revenue: number }>;

export type DashboardResults = {
  calendar: OperationalCalendar;
  dayCounts: DayCounts;
  daysInMonth: number;
  calendarDays: CalendarDayProjection[];
  weekdayMonthTotals: WeekdayMonthTotals;
  weeklyCovers: number;
  monthlyCoversTotal: number;
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
