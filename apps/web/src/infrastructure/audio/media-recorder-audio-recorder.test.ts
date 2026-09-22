import { describe, expect, it } from "vitest";
import { pickMediaRecorderMimeType } from "./media-recorder-audio-recorder.ts";

describe("pickMediaRecorderMimeType", () => {
  it("returns undefined or a supported type string", () => {
    const mime = pickMediaRecorderMimeType();
    if (typeof MediaRecorder === "undefined") {
      expect(mime).toBeUndefined();
      return;
    }
    if (mime) {
      expect(MediaRecorder.isTypeSupported(mime)).toBe(true);
    }
  });
});
