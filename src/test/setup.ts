// Test setup file
import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
window.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

// Mock HTMLMediaElement methods
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

// Mock Telegram WebApp
Object.defineProperty(window, "Telegram", {
  writable: true,
  value: {
    WebApp: {
      initData: "test_init_data",
      initDataUnsafe: {
        user: {
          id: 123456789,
          first_name: "Test",
          last_name: "User",
          username: "testuser",
        },
        auth_date: Date.now(),
        hash: "test_hash",
      },
      version: "6.0",
      platform: "web",
      colorScheme: "light" as const,
      themeParams: {},
      isExpanded: true,
      viewportHeight: 800,
      viewportStableHeight: 800,
      ready: vi.fn(),
      expand: vi.fn(),
      close: vi.fn(),
      sendData: vi.fn(),
      openLink: vi.fn(),
      MainButton: {
        text: "",
        color: "",
        textColor: "",
        isVisible: false,
        isActive: false,
        isProgressVisible: false,
        setText: vi.fn(),
        onClick: vi.fn(),
        offClick: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        showProgress: vi.fn(),
        hideProgress: vi.fn(),
        setParams: vi.fn(),
      },
      BackButton: {
        isVisible: false,
        onClick: vi.fn(),
        offClick: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
      },
      HapticFeedback: {
        impactOccurred: vi.fn(),
        notificationOccurred: vi.fn(),
        selectionChanged: vi.fn(),
      },
      CloudStorage: {
        setItem: vi.fn((key, value, callback) => callback?.(null, true)),
        getItem: vi.fn((key, callback) => callback(null, null)),
        getItems: vi.fn((keys, callback) => callback(null, {})),
        removeItem: vi.fn((key, callback) => callback?.(null, true)),
        removeItems: vi.fn((keys, callback) => callback?.(null, true)),
        getKeys: vi.fn((callback) => callback(null, [])),
      },
    },
  },
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});

