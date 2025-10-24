import { addDays, isBefore, parseISO, startOfDay } from "date-fns";
import { Category, CapacityReservation } from "@prisma/client";

export interface SchedulingRuleContext {
  eventAt: string;
  leadTimeDays: number;
  blackoutDates: Date[];
  closedWeekdays: number[];
  category: Category;
  reservations: CapacityReservation[];
  quantity: number;
}

export function validateLeadTime({ eventAt, leadTimeDays }: SchedulingRuleContext) {
  const eventDate = parseISO(eventAt);
  const minDate = addDays(startOfDay(new Date()), leadTimeDays);
  if (isBefore(eventDate, minDate)) {
    throw new Error("Selected date does not meet the required lead time.");
  }
}

export function validateBlackoutDates({ eventAt, blackoutDates }: SchedulingRuleContext) {
  const eventDate = startOfDay(parseISO(eventAt)).toISOString();
  const blocked = blackoutDates.some((date) => startOfDay(date).toISOString() === eventDate);
  if (blocked) {
    throw new Error("The selected date is unavailable for catering.");
  }
}

export function validateClosedWeekdays({ eventAt, closedWeekdays }: SchedulingRuleContext) {
  const eventDate = parseISO(eventAt);
  if (closedWeekdays.includes(eventDate.getDay())) {
    throw new Error("We are closed on the selected day.");
  }
}

export function validateCapacity({ eventAt, reservations, quantity, category }: SchedulingRuleContext) {
  if (!category.dailyCapacity) return;
  const eventDate = startOfDay(parseISO(eventAt)).toISOString();
  const totalReserved = reservations
    .filter((res) => startOfDay(res.eventAt).toISOString() === eventDate)
    .reduce((acc, res) => acc + res.quantity, 0);

  if (totalReserved + quantity > category.dailyCapacity) {
    throw new Error("Daily capacity has been reached for this category.");
  }
}

export function enforceSchedulingRules(context: SchedulingRuleContext) {
  validateLeadTime(context);
  validateBlackoutDates(context);
  validateClosedWeekdays(context);
  validateCapacity(context);
}
