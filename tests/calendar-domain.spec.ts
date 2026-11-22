import { test, expect } from "@playwright/test";
import {
  addDays,
  getMonthDays,
  getPeriodBounds,
  getTodayInKolkata,
  shiftPeriod,
  startOfWeek,
} from "../src/features/history/lib/history-calendar";

test("calendar dates use Kolkata across UTC midnight and year boundaries", () => {
  expect(getTodayInKolkata(new Date("2026-11-15T19:00:00Z"))).toBe(
    "2026-11-16",
  );
  expect(getTodayInKolkata(new Date("2026-12-31T20:00:00Z"))).toBe(
    "2027-01-01",
  );
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
});

test("previous period moves by one selected unit and clamps month/year ends", () => {
  expect(shiftPeriod("2026-11-16", "day", -1)).toBe("2026-11-15");
  expect(shiftPeriod("2026-11-16", "week", -1)).toBe("2026-11-09");
  expect(shiftPeriod("2026-11-16", "month", -1)).toBe("2026-10-16");
  expect(shiftPeriod("2026-11-16", "year", -1)).toBe("2025-11-16");
  expect(shiftPeriod("2026-01-31", "month", 1)).toBe("2026-02-28");
  expect(shiftPeriod("2024-01-31", "month", 1)).toBe("2024-02-29");
  expect(shiftPeriod("2026-01-16", "month", -1)).toBe("2025-12-16");
  expect(shiftPeriod("2024-02-29", "year", 1)).toBe("2025-02-28");
});

test("day/week/month/year ranges include their first day and exclude the next period", () => {
  expect(startOfWeek("2026-11-16")).toBe("2026-11-15");
  expect(getPeriodBounds("2026-11-16", "day")).toEqual({
    start: "2026-11-16",
    end: "2026-11-17",
  });
  expect(getPeriodBounds("2026-11-16", "week")).toEqual({
    start: "2026-11-15",
    end: "2026-11-22",
  });
  expect(getPeriodBounds("2026-11-16", "month")).toEqual({
    start: "2026-11-01",
    end: "2026-12-01",
  });
  expect(getPeriodBounds("2026-11-16", "year")).toEqual({
    start: "2026-01-01",
    end: "2027-01-01",
  });
});

test("month grids preserve leap day, Sunday order and six complete weeks", () => {
  const days = getMonthDays("2024-02-15");
  expect(days).toHaveLength(42);
  expect(days[0]).toBe("2024-01-28");
  expect(days).toContain("2024-02-29");
  expect(days.at(-1)).toBe("2024-03-09");
  expect(new Set(days).size).toBe(42);
});
