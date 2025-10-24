import {
  enforceSchedulingRules,
  validateBlackoutDates,
  validateCapacity,
  validateClosedWeekdays,
  validateLeadTime,
} from "@/lib/scheduling";

const baseContext = {
  eventAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  leadTimeDays: 2,
  blackoutDates: [],
  closedWeekdays: [],
  category: {
    id: "cat",
    name: "Test",
    description: null,
    sort: 0,
    leadTimeDays: 2,
    dailyCapacity: 10,
  } as any,
  reservations: [],
  quantity: 2,
};

describe("scheduling engine", () => {
  it("throws when lead time not met", () => {
    expect(() =>
      validateLeadTime({
        ...baseContext,
        eventAt: new Date().toISOString(),
      })
    ).toThrow();
  });

  it("throws on blackout dates", () => {
    expect(() =>
      validateBlackoutDates({
        ...baseContext,
        blackoutDates: [new Date(baseContext.eventAt)],
      })
    ).toThrow();
  });

  it("throws when closed on weekday", () => {
    const date = new Date(baseContext.eventAt);
    expect(() =>
      validateClosedWeekdays({
        ...baseContext,
        closedWeekdays: [date.getDay()],
      })
    ).toThrow();
  });

  it("throws when capacity exceeded", () => {
    expect(() =>
      validateCapacity({
        ...baseContext,
        reservations: [
          {
            eventAt: new Date(baseContext.eventAt),
            quantity: 9,
          },
        ] as any,
      })
    ).toThrow();
  });

  it("passes all rules when valid", () => {
    expect(() => enforceSchedulingRules(baseContext)).not.toThrow();
  });
});
