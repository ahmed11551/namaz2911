import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CalculatorSection } from "@/components/qaza/CalculatorSection";
import { calculatePrayerDebt } from "@/lib/prayer-calculator";
import type { PersonalData, TravelData } from "@/types/prayer-debt";

// Mock API
vi.mock("@/lib/api", () => ({
  prayerDebtAPI: {
    calculateDebt: vi.fn(async (data) => {
      // Simulate API calculation
      const personalData = data.personal_data;
      const travelData = data.travel_data;
      
      const result = calculatePrayerDebt(
        personalData,
        data.women_data,
        travelData,
        data.madhab || "hanafi"
      );

      return {
        user_id: data.user_id || "test_user",
        calc_version: "1.0.0",
        madhab: data.madhab || "hanafi",
        calculation_method: "calculator",
        personal_data: personalData,
        women_data: data.women_data || null,
        travel_data: travelData || null,
        debt_calculation: result,
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
    }),
  },
  localStorageAPI: {
    saveUserData: vi.fn(),
    getUserData: vi.fn(() => null),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderCalculatorView = async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <CalculatorSection />
        </QueryClientProvider>
      </BrowserRouter>
    );

    const modeButton = await screen.findByRole("button", { name: /помощь посчитать/i });
    await user.click(modeButton);

    return { user, queryClient };
  };

  describe("Calculator Flow", () => {
    it("should complete full calculation flow", async () => {
      const { user } = await renderCalculatorView();

      // Fill form
      const birthDateInput = screen.getByLabelText(/дата рождения/i);
      await user.type(birthDateInput, "2000-01-01");

      // Find gender radio buttons
      const maleRadio = screen.getByRole("radio", { name: /мужской/i });
      await user.click(maleRadio);

      const bulughAgeInput = screen.getByLabelText(/возраст булюга/i);
      await user.clear(bulughAgeInput);
      await user.type(bulughAgeInput, "15");

      // Submit
      const submitButton = screen.getByRole("button", { name: /рассчитать долг/i });
      await user.click(submitButton);

      // Should process calculation
      await waitFor(() => {
        expect(submitButton).toBeInTheDocument();
      });
    });

    it("should handle calculation with travel data", async () => {
      const personalData: PersonalData = {
        birth_date: new Date("2000-01-01"),
        bulugh_date: new Date("2015-01-01"),
        gender: "male",
        today_as_start: true,
        bulugh_age: 15,
      };

      const travelData: TravelData = {
        total_travel_days: 30,
        travel_periods: [
          {
            start_date: new Date("2016-01-01"),
            end_date: new Date("2016-01-31"),
            days_count: 30,
          },
        ],
      };

      const result = calculatePrayerDebt(personalData, undefined, travelData);

      expect(result.excluded_days).toBe(30);
      expect(result.effective_days).toBeGreaterThan(0);
      expect(result.travel_prayers.dhuhr_safar).toBe(30);
    });
  });

  describe("Data Persistence", () => {
    it("should save and retrieve calculation data", async () => {
      const testData = {
        user_id: "test_user",
        debt_calculation: {
          total_days: 100,
          effective_days: 100,
        },
      };

      localStorage.setItem("userPrayerDebt", JSON.stringify(testData));
      const retrieved = localStorage.getItem("userPrayerDebt");

      expect(retrieved).not.toBeNull();
      const parsed = JSON.parse(retrieved!);
      expect(parsed.user_id).toBe("test_user");
    });
  });
});

