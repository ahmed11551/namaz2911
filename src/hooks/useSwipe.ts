// Хук для свайп-жестов
import { useState, useRef, useCallback, TouchEvent } from "react";

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Минимальное расстояние для срабатывания свайпа
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface SwipeState {
  swiping: boolean;
  direction: "left" | "right" | "up" | "down" | null;
  distance: number;
}

export const useSwipe = (config: SwipeConfig): [SwipeHandlers, SwipeState] => {
  const { 
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    threshold = 50 
  } = config;

  const [state, setState] = useState<SwipeState>({
    swiping: false,
    direction: null,
    distance: 0,
  });

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setState({ swiping: true, direction: null, distance: 0 });
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    let direction: SwipeState["direction"] = null;
    let distance = 0;

    if (absX > absY) {
      direction = diffX > 0 ? "right" : "left";
      distance = absX;
    } else {
      direction = diffY > 0 ? "down" : "up";
      distance = absY;
    }

    setState({ swiping: true, direction, distance });
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (absX > absY && absX > threshold) {
      if (diffX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      if (diffY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    setState({ swiping: false, direction: null, distance: 0 });
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return [{ onTouchStart, onTouchMove, onTouchEnd }, state];
};

// Хук для свайп-навигации между страницами
interface PageSwipeConfig {
  pages: string[];
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const usePageSwipe = ({ pages, currentPage, onNavigate }: PageSwipeConfig) => {
  const currentIndex = pages.indexOf(currentPage);

  const goToNext = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      onNavigate(pages[currentIndex + 1]);
    }
  }, [currentIndex, pages, onNavigate]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(pages[currentIndex - 1]);
    }
  }, [currentIndex, pages, onNavigate]);

  const [handlers, state] = useSwipe({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 80,
  });

  return {
    handlers,
    state,
    canGoNext: currentIndex < pages.length - 1,
    canGoPrev: currentIndex > 0,
    currentIndex,
    totalPages: pages.length,
  };
};

