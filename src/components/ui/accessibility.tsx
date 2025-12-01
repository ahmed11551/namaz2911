// Компоненты для улучшения доступности

import { useEffect, useRef } from "react";

/**
 * Хук для управления фокусом и доступностью
 */
export const useFocusManagement = () => {
  const focusRef = useRef<HTMLElement | null>(null);

  const focus = () => {
    focusRef.current?.focus();
  };

  const blur = () => {
    focusRef.current?.blur();
  };

  return { focusRef, focus, blur };
};

/**
 * Компонент для скрытого заголовка для screen readers
 */
export const ScreenReaderOnly = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className="sr-only"
      {...props}
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Хук для объявления изменений для screen readers
 */
export const useAriaLive = (message: string, priority: "polite" | "assertive" = "polite") => {
  useEffect(() => {
    if (!message) return;

    const ariaLive = document.createElement("div");
    ariaLive.setAttribute("role", "status");
    ariaLive.setAttribute("aria-live", priority);
    ariaLive.setAttribute("aria-atomic", "true");
    ariaLive.className = "sr-only";
    ariaLive.textContent = message;

    document.body.appendChild(ariaLive);

    // Удаляем после объявления
    setTimeout(() => {
      document.body.removeChild(ariaLive);
    }, 1000);

    return () => {
      if (document.body.contains(ariaLive)) {
        document.body.removeChild(ariaLive);
      }
    };
  }, [message, priority]);
};

/**
 * Хук для управления клавиатурной навигацией
 */
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
        case " ":
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case "Escape":
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case "ArrowUp":
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEnter, onEscape, onArrowUp, onArrowDown]);
};

/**
 * Утилита для получения ARIA-лейбла
 */
export const getAriaLabel = (label: string, description?: string): string => {
  return description ? `${label}. ${description}` : label;
};

