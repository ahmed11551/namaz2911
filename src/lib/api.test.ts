import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { localStorageAPI } from "./api";
import type { UserPrayerDebt } from "@/types/prayer-debt";

describe("localStorageAPI", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("getUserData", () => {
    it("should return null when no data exists", () => {
      const result = localStorageAPI.getUserData();
      expect(result).toBeNull();
    });

    it("should return saved user data", () => {
      const testData: UserPrayerDebt = {
        user_id: "test_user",
        calc_version: "1.0.0",
        madhab: "hanafi",
        calculation_method: "calculator",
        personal_data: {
          birth_date: new Date("2000-01-01"),
          bulugh_date: new Date("2015-01-01"),
          gender: "male",
          today_as_start: true,
          bulugh_age: 15,
        },
        debt_calculation: {
          period: {
            start: new Date("2015-01-01"),
            end: new Date(),
          },
          total_days: 100,
          excluded_days: 0,
          effective_days: 100,
          missed_prayers: {
            fajr: 100,
            dhuhr: 100,
            asr: 100,
            maghrib: 100,
            isha: 100,
            witr: 100,
          },
          travel_prayers: {
            dhuhr_safar: 0,
            asr_safar: 0,
            isha_safar: 0,
          },
        },
        repayment_progress: {
          completed_prayers: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
          last_updated: new Date(),
        },
      };

      localStorageAPI.saveUserData(testData);
      const result = localStorageAPI.getUserData();

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe("test_user");
      expect(result?.debt_calculation.total_days).toBe(100);
    });

    it("should handle corrupted data gracefully", () => {
      localStorage.setItem("userPrayerDebt", "invalid json");

      const result = localStorageAPI.getUserData();

      expect(result).toBeNull();
      expect(localStorage.getItem("userPrayerDebt")).toBeNull();
    });
  });

  describe("saveUserData", () => {
    it("should save user data to localStorage", () => {
      const testData: UserPrayerDebt = {
        user_id: "test_user",
        calc_version: "1.0.0",
        madhab: "hanafi",
        calculation_method: "calculator",
        personal_data: {
          birth_date: new Date("2000-01-01"),
          bulugh_date: new Date("2015-01-01"),
          gender: "male",
          today_as_start: true,
          bulugh_age: 15,
        },
        debt_calculation: {
          period: {
            start: new Date("2015-01-01"),
            end: new Date(),
          },
          total_days: 50,
          excluded_days: 0,
          effective_days: 50,
          missed_prayers: {
            fajr: 50,
            dhuhr: 50,
            asr: 50,
            maghrib: 50,
            isha: 50,
            witr: 50,
          },
          travel_prayers: {
            dhuhr_safar: 0,
            asr_safar: 0,
            isha_safar: 0,
          },
        },
        repayment_progress: {
          completed_prayers: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
          last_updated: new Date(),
        },
      };

      localStorageAPI.saveUserData(testData);
      const saved = localStorage.getItem("userPrayerDebt");
      
      expect(saved).not.toBeNull();
      expect(saved).toContain("test_user");
    });

    it("should serialize dates correctly", () => {
      const testData: UserPrayerDebt = {
        user_id: "test_user",
        calc_version: "1.0.0",
        madhab: "hanafi",
        calculation_method: "calculator",
        personal_data: {
          birth_date: new Date("2000-01-01"),
          bulugh_date: new Date("2015-01-01"),
          gender: "male",
          today_as_start: true,
          bulugh_age: 15,
        },
        debt_calculation: {
          period: {
            start: new Date("2015-01-01"),
            end: new Date("2020-01-01"),
          },
          total_days: 100,
          excluded_days: 0,
          effective_days: 100,
          missed_prayers: {
            fajr: 100,
            dhuhr: 100,
            asr: 100,
            maghrib: 100,
            isha: 100,
            witr: 100,
          },
          travel_prayers: {
            dhuhr_safar: 0,
            asr_safar: 0,
            isha_safar: 0,
          },
        },
        repayment_progress: {
          completed_prayers: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
          last_updated: new Date("2020-01-01"),
        },
      };

      localStorageAPI.saveUserData(testData);
      const result = localStorageAPI.getUserData();

      expect(result?.debt_calculation.period.start).toBeInstanceOf(Date);
      expect(result?.debt_calculation.period.end).toBeInstanceOf(Date);
      expect(result?.repayment_progress.last_updated).toBeInstanceOf(Date);
    });
  });

  describe("clearUserData", () => {
    it("should remove user data from localStorage", () => {
      const testData: UserPrayerDebt = {
        user_id: "test_user",
        calc_version: "1.0.0",
        madhab: "hanafi",
        calculation_method: "calculator",
        personal_data: {
          birth_date: new Date("2000-01-01"),
          bulugh_date: new Date("2015-01-01"),
          gender: "male",
          today_as_start: true,
          bulugh_age: 15,
        },
        debt_calculation: {
          period: {
            start: new Date("2015-01-01"),
            end: new Date(),
          },
          total_days: 100,
          excluded_days: 0,
          effective_days: 100,
          missed_prayers: {
            fajr: 100,
            dhuhr: 100,
            asr: 100,
            maghrib: 100,
            isha: 100,
            witr: 100,
          },
          travel_prayers: {
            dhuhr_safar: 0,
            asr_safar: 0,
            isha_safar: 0,
          },
        },
        repayment_progress: {
          completed_prayers: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
          last_updated: new Date(),
        },
      };

      localStorageAPI.saveUserData(testData);
      expect(localStorageAPI.getUserData()).not.toBeNull();

      localStorageAPI.clearUserData();
      expect(localStorageAPI.getUserData()).toBeNull();
    });
  });
});

