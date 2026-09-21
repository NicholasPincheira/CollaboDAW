import { describe, expect, it } from "vitest";
import { NOT_MEASURED, createBootstrapDiagnostics, formatMeasured } from "./bootstrap-diagnostics.ts";

describe("bootstrap diagnostics", () => {
  it("keeps unmeasured values distinct from zero", () => {
    expect(formatMeasured(null)).toBe(NOT_MEASURED);
    expect(formatMeasured(0)).toBe("0");
    const snapshot = createBootstrapDiagnostics();
    const measured = snapshot.readings.filter((item) =>
      ["sample-rate", "base-latency", "output-latency", "input-channels", "sync-offset", "drift"].includes(
        item.id,
      ),
    );
    expect(measured.every((item) => item.value === NOT_MEASURED)).toBe(true);
    expect(snapshot.readings.find((item) => item.id === "device-profile")?.value).toBe("not resolved");
  });
});
