import { describe, expect, it } from "vitest";
import { parseHashRoute, routeToHash } from "./hash-route.ts";

describe("hash routes", () => {
  it("defaults to the dashboard", () => {
    expect(parseHashRoute("")).toEqual({ name: "dashboard" });
    expect(parseHashRoute("#/")).toEqual({ name: "dashboard" });
  });

  it("opens a studio session route", () => {
    expect(parseHashRoute("#/session/abc-123")).toEqual({
      name: "studio",
      sessionId: "abc-123",
    });
    expect(routeToHash({ name: "studio", sessionId: "abc 1" })).toBe("#/session/abc%201");
  });
});
