import { describe, it, expect } from "vitest";
import {
  calculateBulughDate,
  calculatePrayerDebt,
  validateCalculationData,
} from "@/lib/prayer-calculator";
import type { PersonalData, WomenData, TravelData } from "@/types/prayer-debt";

describe("Edge Cases", () => {
  describe("Date Edge Cases", () => {
    it("should handle leap year dates", () => {
      const birthDate = new Date("2000-02-29"); // Leap year
      const bulughDate = calculateBulughDate(birthDate, 15);

      expect(bulughDate).toBeInstanceOf(Date);
      expect(bulughDate.getTime()).not.toBeNaN();
    });

    it("should handle very old birth dates", () => {
      const birthDate = new Date("1900-01-01");
      const bulughDate = calculateBulughDate(birthDate, 15);

      expect(bulughDate).toBeInstanceOf(Date);
      expect(bulughDate.getFullYear()).toBeGreaterThanOrEqual(1914);
    });

    it("should handle very recent birth dates", () => {
      const birthDate = new Date("2010-01-01");
      const bulughDate = calculateBulughDate(birthDate, 15);

      expect(bulughDate).toBeInstanceOf(Date);
      expect(bulughDate.getFullYear()).toBeGreaterThanOrEqual(2024);
    });

    it("should handle same start and end dates", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: false,
        prayer_start_date: new Date("2015-01-01"), // Same as bulugh_date
        bulugh_age: 15,
      };

      const result = calculatePrayerDebt(personalData);

      expect(result.total_days).toBe(0);
      expect(result.effective_days).toBe(0);
      expect(result.missed_prayers.fajr).toBe(0);
    });
  });

  describe("Extreme Values", () => {
    it("should handle maximum travel days", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const travelData: TravelData = {
        total_travel_days: 10000, // Very large number
        travel_periods: [],
      };

      const result = calculatePrayerDebt(personalData, undefined, travelData);

      expect(result.excluded_days).toBe(10000);
      expect(result.effective_days).toBe(Math.max(0, result.total_days - 10000));
    });

    it("should handle zero travel days", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const travelData: TravelData = {
        total_travel_days: 0,
        travel_periods: [],
      };

      const result = calculatePrayerDebt(personalData, undefined, travelData);

      expect(result.excluded_days).toBe(0);
      expect(result.effective_days).toBe(result.total_days);
    });

    it("should handle maximum women exclusion days", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "female",
        today_as_start: true,
        bulugh_age: 15,
      };

      const womenData: WomenData = {
        haid_days_per_month: 15, // Maximum
        nifas_days_per_childbirth: 40, // Maximum
        childbirth_count: 10, // Many children
      };

      const result = calculatePrayerDebt(personalData, womenData);

      expect(result.excluded_days).toBeGreaterThan(0);
      expect(result.effective_days).toBeLessThan(result.total_days);
    });
  });

  describe("Boundary Conditions", () => {
    it("should handle minimum bulugh age (12)", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2012-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 12,
      };

      const result = validateCalculationData(personalData);

      expect(result.valid).toBe(true);
    });

    it("should handle maximum bulugh age (18)", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2018-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 18,
      };

      const result = validateCalculationData(personalData);

      expect(result.valid).toBe(true);
    });

    it("should reject bulugh age below 12", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2011-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 11,
      };

      const result = validateCalculationData(personalData);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("12"))).toBe(true);
    });

    it("should reject bulugh age above 18", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2019-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 19,
      };

      const result = validateCalculationData(personalData);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("18"))).toBe(true);
    });
  });

  describe("Empty and Null Cases", () => {
    it("should handle missing travel data", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = calculatePrayerDebt(personalData, undefined, undefined);

      expect(result.excluded_days).toBe(0);
      expect(result.travel_prayers.dhuhr_safar).toBe(0);
    });

    it("should handle missing women data for female", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "female",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = calculatePrayerDebt(personalData, undefined, undefined);

      // Should still calculate, but without exclusions
      expect(result.excluded_days).toBe(0);
    });

    it("should handle empty travel periods array", () => {
      const travelData: TravelData = {
        total_travel_days: 10,
        travel_periods: [],
      };

      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = calculatePrayerDebt(personalData, undefined, travelData);

      expect(result.excluded_days).toBe(10);
    });
  });

  describe("Madhab Differences", () => {
    it("should handle hanafi madhab (with witr)", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = calculatePrayerDebt(personalData, undefined, undefined, "hanafi");

      expect(result.missed_prayers.witr).toBeGreaterThan(0);
    });

    it("should handle shafii madhab (without witr)", () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = calculatePrayerDebt(personalData, undefined, undefined, "shafii");

      expect(result.missed_prayers.witr).toBe(0);
    });
  });

  describe("Validation Edge Cases", () => {
    it("should handle travel period with start = end", () => {
      const travelData: TravelData = {
        total_travel_days: 1,
        travel_periods: [
          {
            start_date: new Date("2016-01-01"),
            end_date: new Date("2016-01-01"), // Same date
            days_count: 1,
          },
        ],
      };

      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = validateCalculationData(personalData, undefined, travelData);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("раньше"))).toBe(true);
    });

    it("should handle negative days count", () => {
      const travelData: TravelData = {
        total_travel_days: 10,
        travel_periods: [
          {
            start_date: new Date("2016-01-01"),
            end_date: new Date("2016-01-11"),
            days_count: -5, // Negative
          },
        ],
      };

      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const result = validateCalculationData(personalData, undefined, travelData);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("отрицательным"))).toBe(true);
    });
  });
});

