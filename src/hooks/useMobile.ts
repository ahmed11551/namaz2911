import { useState, useEffect } from "react";

/**
 * Хук для определения мобильного устройства
 * Улучшает UX на мобильных устройствах
 * 
 * @returns {Object} Объект с информацией о типе устройства
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setScreenWidth(width);

      // Определение типа устройства
      const mobile = width < 768; // < 768px - мобильные
      const tablet = width >= 768 && width < 1024; // 768px - 1024px - планшеты
      const desktop = width >= 1024; // >= 1024px - десктопы

      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
    };

    // Проверка при монтировании
    checkDevice();

    // Проверка при изменении размера окна
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    isSmallScreen: screenWidth < 640,
    isMediumScreen: screenWidth >= 640 && screenWidth < 1024,
    isLargeScreen: screenWidth >= 1024,
  };
}

/**
 * Хук для определения, используется ли приложение в Telegram Mini App
 * 
 * @returns {boolean} true, если приложение запущено в Telegram
 */
export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const checkTelegram = () => {
      // Проверка наличия Telegram WebApp API
      const isInTelegram = 
        typeof window !== "undefined" &&
        window.Telegram?.WebApp !== undefined;
      
      setIsTelegram(isInTelegram);
    };

    checkTelegram();
  }, []);

  return isTelegram;
}

