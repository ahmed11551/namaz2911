import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateBulughDate,
  calculatePrayerDebt,
  validateCalculationData,
} from "./prayer-calculator";
import type { PersonalData, WomenData, TravelData } from "@/types/prayer-debt";

describe("prayer-calculator", () => {
  describe("calculateBulughDate", () => {
    it("should calculate bulugh date correctly for 15 years", () => {
      const birthDate = new Date("2000-01-01");
      const bulughDate = calculateBulughDate(birthDate, 15);
      
      expect(bulughDate).toBeInstanceOf(Date);
      expect(bulughDate.getFullYear()).toBeGreaterThanOrEqual(2014);
      expect(bulughDate.getFullYear()).toBeLessThanOrEqual(2016);
    });

    it("should handle custom bulugh age", () => {
      const birthDate = new Date("2000-01-01");
      const bulughDate = calculateBulughDate(birthDate, 12);
      
      expect(bulughDate.getFullYear()).toBeLessThan(
        calculateBulughDate(birthDate, 15).getFullYear()
      );
    });

    it("should handle edge case: birth date in the past", () => {
      const birthDate = new Date("1990-01-01");
      const bulughDate = calculateBulughDate(birthDate, 15);
      
      expect(bulughDate).toBeInstanceOf(Date);
      expect(bulughDate.getTime()).toBeLessThan(Date.now());
    });
  });

  describe("calculatePrayerDebt", () => {
    const basePersonalData: PersonalData = {
      birth_date: new Date("2000-01-01"),
      bulugh_date: new Date("2015-01-01"),
      gender: "male",
      today_as_start: true,
      bulugh_age: 15,
    };

    it("should calculate debt for male without exclusions", () => {
      const result = calculatePrayerDebt(basePersonalData);

      expect(result.effective_days).toBeGreaterThan(0);
      expect(result.missed_prayers.fajr).toBe(result.effective_days);
      expect(result.missed_prayers.dhuhr).toBe(result.effective_days);
      expect(result.missed_prayers.asr).toBe(result.effective_days);
      expect(result.missed_prayers.maghrib).toBe(result.effective_days);
      expect(result.missed_prayers.isha).toBe(result.effective_days);
      expect(result.missed_prayers.witr).toBe(result.effective_days); // Hanafi
    });

    it("should exclude travel days", () => {
      const travelData: TravelData = {
        total_travel_days: 30,
        travel_periods: [],
      };

      const result = calculatePrayerDebt(basePersonalData, undefined, travelData);

      expect(result.excluded_days).toBe(30);
      expect(result.effective_days).toBe(result.total_days - 30);
    });

    it("should exclude women days (haid + nifas)", () => {
      const womenData: WomenData = {
        haid_days_per_month: 5,
        nifas_days_per_childbirth: 40,
        childbirth_count: 2,
      };

      const femalePersonalData: PersonalData = {
        ...basePersonalData,
        gender: "female",
      };

      const result = calculatePrayerDebt(femalePersonalData, womenData);

      expect(result.excluded_days).toBeGreaterThan(0);
      expect(result.effective_days).toBeLessThan(result.total_days);
    });

    it("should handle shafii madhab (no witr)", () => {
      const result = calculatePrayerDebt(basePersonalData, undefined, undefined, "shafii");

      expect(result.missed_prayers.witr).toBe(0);
      expect(result.missed_prayers.fajr).toBeGreaterThan(0);
    });

    it("should handle zero effective days", () => {
      const travelData: TravelData = {
        total_travel_days: 10000, // Very large number
        travel_periods: [],
      };

      const result = calculatePrayerDebt(basePersonalData, undefined, travelData);

      expect(result.effective_days).toBe(0);
      expect(result.missed_prayers.fajr).toBe(0);
    });

    it("should calculate travel prayers", () => {
      const travelData: TravelData = {
        total_travel_days: 10,
        travel_periods: [],
      };

      const result = calculatePrayerDebt(basePersonalData, undefined, travelData);

      expect(result.travel_prayers.dhuhr_safar).toBe(10);
      expect(result.travel_prayers.asr_safar).toBe(10);
      expect(result.travel_prayers.isha_safar).toBe(10);
    });

    it("should handle prayer_start_date instead of today", () => {
      const personalData: PersonalData = {
        ...basePersonalData,
        today_as_start: false,
        prayer_start_date: new Date("2020-01-01"),
      };

      const result = calculatePrayerDebt(personalData);

      expect(result.period.end).toEqual(new Date("2020-01-01"));
      expect(result.total_days).toBeGreaterThan(0);
    });
  });

  describe("validateCalculationData", () => {
    const basePersonalData: PersonalData = {
      birth_date: new Date("2000-01-01"),
      bulugh_date: new Date("2015-01-01"),
      gender: "male",
      today_as_start: true,
      bulugh_age: 15,
    };

    it("should validate correct data", () => {
      const result = validateCalculationData(basePersonalData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject future birth date", () => {
      const invalidData: PersonalData = {
        ...basePersonalData,
        birth_date: new Date("2100-01-01"),
      };

      const result = validateCalculationData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Дата рождения не может быть в будущем");
    });

    it("should reject prayer_start_date before bulugh_date", () => {
      const invalidData: PersonalData = {
        ...basePersonalData,
        today_as_start: false,
        prayer_start_date: new Date("2010-01-01"),
      };

      const result = validateCalculationData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Дата начала молитв должна быть не раньше даты булюга");
    });

    it("should reject invalid bulugh_age", () => {
      const invalidData1: PersonalData = {
        ...basePersonalData,
        bulugh_age: 10,
      };

      const invalidData2: PersonalData = {
        ...basePersonalData,
        bulugh_age: 20,
      };

      expect(validateCalculationData(invalidData1).valid).toBe(false);
      expect(validateCalculationData(invalidData2).valid).toBe(false);
    });

    it("should validate women data", () => {
      const womenData: WomenData = {
        haid_days_per_month: 5,
        nifas_days_per_childbirth: 40,
        childbirth_count: 2,
      };

      const femaleData: PersonalData = {
        ...basePersonalData,
        gender: "female",
      };

      const result = validateCalculationData(femaleData, womenData);

      expect(result.valid).toBe(true);
    });

    it("should reject invalid haid_days_per_month", () => {
      const invalidWomenData: WomenData = {
        haid_days_per_month: 20, // > 15
        nifas_days_per_childbirth: 40,
        childbirth_count: 1,
      };

      const femaleData: PersonalData = {
        ...basePersonalData,
        gender: "female",
      };

      const result = validateCalculationData(femaleData, invalidWomenData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Дней хайда в месяц не может быть больше 15");
    });

    it("should reject invalid nifas_days_per_childbirth", () => {
      const invalidWomenData: WomenData = {
        haid_days_per_month: 5,
        nifas_days_per_childbirth: 50, // > 40
        childbirth_count: 1,
      };

      const femaleData: PersonalData = {
        ...basePersonalData,
        gender: "female",
      };

      const result = validateCalculationData(femaleData, invalidWomenData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Дней нифаса за роды не может быть больше 40");
    });

    it("should validate travel data", () => {
      const travelData: TravelData = {
        total_travel_days: 10,
        travel_periods: [
          {
            start_date: new Date("2016-01-01"),
            end_date: new Date("2016-01-11"),
            days_count: 10,
          },
        ],
      };

      const result = validateCalculationData(basePersonalData, undefined, travelData);

      expect(result.valid).toBe(true);
    });

    it("should reject negative travel days", () => {
      const invalidTravelData: TravelData = {
        total_travel_days: -5,
        travel_periods: [],
      };

      const result = validateCalculationData(basePersonalData, undefined, invalidTravelData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Количество дней в пути не может быть отрицательным");
    });

    it("should reject overlapping travel periods", () => {
      const invalidTravelData: TravelData = {
        total_travel_days: 20,
        travel_periods: [
          {
            start_date: new Date("2016-01-01"),
            end_date: new Date("2016-01-15"),
            days_count: 14,
          },
          {
            start_date: new Date("2016-01-10"), // Overlaps with first
            end_date: new Date("2016-01-20"),
            days_count: 10,
          },
        ],
      };

      const result = validateCalculationData(basePersonalData, undefined, invalidTravelData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Периоды путешествий не должны пересекаться");
    });

    it("should reject period exceeding 80 years", () => {
      const oldPersonalData: PersonalData = {
        ...basePersonalData,
        birth_date: new Date("1900-01-01"),
        bulugh_date: new Date("1915-01-01"),
      };

      const result = validateCalculationData(oldPersonalData);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("80 лет"))).toBe(true);
    });
  });
});

