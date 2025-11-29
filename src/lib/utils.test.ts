import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      const result = cn("foo", "bar");
      expect(result).toContain("foo");
      expect(result).toContain("bar");
    });

    it("should handle conditional classes", () => {
      const shouldIncludeBar = false;
      const result = cn("foo", shouldIncludeBar && "bar", "baz");
      expect(result).toContain("foo");
      expect(result).toContain("baz");
      expect(result).not.toContain("bar");
    });

    it("should merge Tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4");
      // px-4 should override px-2
      expect(result).toContain("px-4");
      expect(result).toContain("py-1");
    });

    it("should handle empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle undefined and null", () => {
      const result = cn("foo", undefined, null, "bar");
      expect(result).toContain("foo");
      expect(result).toContain("bar");
    });

    it("should handle arrays", () => {
      const result = cn(["foo", "bar"], "baz");
      expect(result).toContain("foo");
      expect(result).toContain("bar");
      expect(result).toContain("baz");
    });

    it("should handle objects", () => {
      const result = cn({ foo: true, bar: false, baz: true });
      expect(result).toContain("foo");
      expect(result).toContain("baz");
      expect(result).not.toContain("bar");
    });
  });
});

