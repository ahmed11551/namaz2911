import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorSection } from "./CalculatorSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserPrayerDebt } from "@/types/prayer-debt";

// Mock API - must be defined inside vi.mock factory
vi.mock("@/lib/api", () => {
  const mockCalculateDebt = vi.fn();
  const mockSaveUserData = vi.fn();
  const mockGetUserData = vi.fn(() => null);
  
  return {
    prayerDebtAPI: {
      calculateDebt: mockCalculateDebt,
    },
    localStorageAPI: {
      saveUserData: mockSaveUserData,
      getUserData: mockGetUserData,
    },
  };
});

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock telegram
vi.mock("@/lib/telegram", () => ({
  getTelegramUserId: vi.fn(() => null),
}));

// Mock audit-log
vi.mock("@/lib/audit-log", () => ({
  logCalculation: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createMockUserPrayerDebt = (): UserPrayerDebt => ({
  user_id: "test-user",
  calc_version: "v1",
  madhab: "hanafi",
  calculation_method: "calculator",
  personal_data: {
    birth_date: new Date("2000-01-01"),
    gender: "male",
    bulugh_age: 15,
    bulugh_date: new Date("2015-01-01"),
    prayer_start_date: new Date("2015-01-01"),
    today_as_start: false,
  },
  travel_data: {
    total_travel_days: 0,
    travel_periods: [],
  },
  debt_calculation: {
    period: { start: new Date("2015-01-01"), end: new Date("2016-01-01") },
    total_days: 365,
    excluded_days: 0,
    effective_days: 365,
    missed_prayers: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      witr: 0,
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
  });

describe("CalculatorSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCalculatorMode = async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CalculatorSection />
      </QueryClientProvider>
    );

    const modeButton = await screen.findByRole("button", { name: /помощь посчитать/i });
    await user.click(modeButton);
    return { user, queryClient };
  };

  it("should render calculator form", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CalculatorSection />
      </QueryClientProvider>
    );

    expect(screen.getByText(/калькулятор пропущенных намазов/i)).toBeInTheDocument();
  });

  it("should show validation errors for invalid input", async () => {
    const { user } = await renderCalculatorMode();

    const submitButton = screen.getByRole("button", { name: /рассчитать долг/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/пожалуйста, укажите дату рождения/i)).toBeInTheDocument();
    });
  });

  it("should handle form submission with valid data", async () => {
    const { user } = await renderCalculatorMode();
    const { prayerDebtAPI } = await import("@/lib/api");
    vi.mocked(prayerDebtAPI.calculateDebt).mockResolvedValue(createMockUserPrayerDebt());

    const birthDateInput = screen.getByLabelText(/дата рождения/i);
    await user.type(birthDateInput, "2000-01-01");

    // Find gender radio buttons by their values
    const maleRadio = screen.getByRole("radio", { name: /мужской/i });
    await user.click(maleRadio);

    // Submit form
    const submitButton = screen.getByRole("button", { name: /рассчитать долг/i });
    await user.click(submitButton);

    // Should attempt to calculate
    await waitFor(() => {
      expect(prayerDebtAPI.calculateDebt).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

