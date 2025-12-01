// Алгоритм расчета пропущенных намазов согласно ТЗ

import type {
  PersonalData,
  WomenData,
  TravelData,
  DebtCalculation,
  MissedPrayers,
  TravelPrayers,
  Madhab,
} from "@/types/prayer-debt";

/**
 * Конвертация даты из григорианского календаря в хиджру (Umm al-Qura)
 * Использует API e-Replika, с fallback на упрощенную версию
 */
async function convertToHijri(
  gregorianDate: Date
): Promise<{ year: number; month: number; day: number }> {
  try {
    // Попытка использовать API e-Replika
    const { eReplikaAPI } = await import("@/lib/api");
    return await eReplikaAPI.convertToHijri(gregorianDate);
  } catch (error) {
    // Fallback на упрощенную конвертацию
    console.warn("API недоступен, используем упрощенную конвертацию:", error);
    const date = new Date(gregorianDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Приблизительная формула (для демо)
    const hijriYear = Math.floor((year - 622) * 0.970224);
    const hijriMonth = month;
    const hijriDay = day;

    return { year: hijriYear, month: hijriMonth, day: hijriDay };
  }
}

/**
 * Конвертация даты из хиджры в григорианский календарь
 * Использует API e-Replika, с fallback на упрощенную версию
 */
async function convertToGregorian(
  hijriDate: { year: number; month: number; day: number }
): Promise<Date> {
  try {
    // Попытка использовать API e-Replika
    const { eReplikaAPI } = await import("@/lib/api");
    return await eReplikaAPI.convertFromHijri(hijriDate);
  } catch (error) {
    // Fallback на упрощенную конвертацию
    console.warn("API недоступен, используем упрощенную конвертацию:", error);
    const gregorianYear = Math.floor(hijriDate.year / 0.970224) + 622;
    const date = new Date(gregorianYear, hijriDate.month - 1, hijriDate.day);
    return date;
  }
}

/**
 * Расчет даты булюга
 * Асинхронная версия с использованием API e-Replika
 */
export async function calculateBulughDateAsync(
  birthDate: Date,
  customBulughAge: number = 15
): Promise<Date> {
  const hijriBirthDate = await convertToHijri(birthDate);
  const bulughHijriDate = {
    year: hijriBirthDate.year + customBulughAge,
    month: hijriBirthDate.month,
    day: hijriBirthDate.day,
  };
  return await convertToGregorian(bulughHijriDate);
}

/**
 * Расчет даты булюга (синхронная версия для обратной совместимости)
 */
export function calculateBulughDate(
  birthDate: Date,
  customBulughAge: number = 15
): Date {
  // Используем упрощенную конвертацию для синхронной версии
  const date = new Date(birthDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hijriYear = Math.floor((year - 622) * 0.970224);
  const bulughHijriYear = hijriYear + customBulughAge;
  const gregorianYear = Math.floor(bulughHijriYear / 0.970224) + 622;

  return new Date(gregorianYear, month - 1, day);
}

/**
 * Расчет количества дней между двумя датами
 */
function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Расчет исключенных дней для женщин (хайд и нифас)
 */
function calculateWomenExcludedDays(
  totalDays: number,
  womenData: WomenData
): number {
  const totalMonths = totalDays / 30.44; // Среднее количество дней в месяце
  const haidDays = totalMonths * womenData.haid_days_per_month;
  const nifasDays = womenData.childbirth_count * womenData.nifas_days_per_childbirth;
  return Math.floor(haidDays + nifasDays);
}

/**
 * Основная функция расчета долга намазов
 */
export function calculatePrayerDebt(
  personalData: PersonalData,
  womenData?: WomenData,
  travelData?: TravelData,
  madhab: Madhab = "hanafi"
): DebtCalculation {
  // Определение периода
  const startDate = personalData.bulugh_date;
  const endDate = personalData.today_as_start
    ? new Date()
    : personalData.prayer_start_date;

  const totalDays = calculateDaysBetween(startDate, endDate);

  // Расчет исключенных дней
  let excludedDays = 0;

  if (personalData.gender === "female" && womenData) {
    excludedDays += calculateWomenExcludedDays(totalDays, womenData);
  }

  if (travelData) {
    excludedDays += travelData.total_travel_days;
  }

  // Эффективные дни
  const effectiveDays = Math.max(0, totalDays - excludedDays);

  // Расчет пропущенных намазов
  // В шафиитском мазхабе витр не считается обязательным
  const missed_prayers: MissedPrayers = {
    fajr: effectiveDays,
    dhuhr: effectiveDays,
    asr: effectiveDays,
    maghrib: effectiveDays,
    isha: effectiveDays,
    witr: madhab === "hanafi" ? effectiveDays : 0,
  };

  // Расчет сафар-намазов
  const travel_prayers: TravelPrayers = {
    dhuhr_safar: travelData?.total_travel_days || 0,
    asr_safar: travelData?.total_travel_days || 0,
    isha_safar: travelData?.total_travel_days || 0,
  };

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    total_days: totalDays,
    excluded_days: excludedDays,
    effective_days: effectiveDays,
    missed_prayers,
    travel_prayers,
  };
}

/**
 * Валидация данных расчета
 */
export function validateCalculationData(
  personalData: PersonalData,
  womenData?: WomenData,
  travelData?: TravelData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Проверка дат
  if (personalData.birth_date > new Date()) {
    errors.push("Дата рождения не может быть в будущем");
  }

  if (!personalData.today_as_start && personalData.prayer_start_date < personalData.bulugh_date) {
    errors.push("Дата начала молитв должна быть не раньше даты булюга");
  }

  // Проверка возраста булюга
  if (personalData.bulugh_age < 12 || personalData.bulugh_age > 18) {
    errors.push("Возраст булюга должен быть от 12 до 18 лет");
  }

  // Проверка данных для женщин
  if (personalData.gender === "female" && womenData) {
    if (womenData.haid_days_per_month > 15) {
      errors.push("Дней хайда в месяц не может быть больше 15");
    }
    if (womenData.haid_days_per_month < 1) {
      errors.push("Дней хайда в месяц должно быть не менее 1");
    }
    if (womenData.nifas_days_per_childbirth > 40) {
      errors.push("Дней нифаса за роды не может быть больше 40");
    }
    if (womenData.childbirth_count < 0) {
      errors.push("Количество родов не может быть отрицательным");
    }
  }

  // Проверка данных о путешествиях
  if (travelData) {
    if (travelData.total_travel_days < 0) {
      errors.push("Количество дней в пути не может быть отрицательным");
    }

    // Проверка периодов путешествий
    for (const period of travelData.travel_periods) {
      if (period.start_date >= period.end_date) {
        errors.push("Дата начала путешествия должна быть раньше даты окончания");
      }
      if (period.days_count < 0) {
        errors.push("Количество дней в периоде путешествия не может быть отрицательным");
      }
    }

    // Проверка пересечений периодов
    for (let i = 0; i < travelData.travel_periods.length; i++) {
      for (let j = i + 1; j < travelData.travel_periods.length; j++) {
        const period1 = travelData.travel_periods[i];
        const period2 = travelData.travel_periods[j];
        if (
          (period1.start_date <= period2.end_date && period1.end_date >= period2.start_date)
        ) {
          errors.push("Периоды путешествий не должны пересекаться");
        }
      }
    }
  }

  // Ограничение общего периода (80 лет)
  const maxDays = 80 * 365;
  const totalDays = calculateDaysBetween(
    personalData.bulugh_date,
    personalData.today_as_start ? new Date() : personalData.prayer_start_date
  );
  if (totalDays > maxDays) {
    errors.push(`Общий период не может превышать 80 лет (${maxDays} дней)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

