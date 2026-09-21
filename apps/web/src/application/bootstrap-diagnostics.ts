import type { AudioDiagnostics } from "../domain/audio/audio-engine.ts";
import type { AudioDeviceSelection } from "../domain/audio/audio-device-manager.ts";
import type { ClockSyncSnapshot } from "../domain/session/clock-synchronizer.ts";
import { PlaceholderAudioDeviceManager } from "../infrastructure/audio/placeholder-audio-device-manager.ts";
import { PlaceholderAudioEngine } from "../infrastructure/audio/placeholder-audio-engine.ts";
import { PlaceholderClockSynchronizer } from "../infrastructure/session/placeholder-clock-synchronizer.ts";

export const NOT_MEASURED = "not measured";

export type DiagnosticGroup = "audio" | "device" | "network" | "sync";

export interface DiagnosticReading {
  id: string;
  label: string;
  value: string;
  group: DiagnosticGroup;
}

export interface DiagnosticsSnapshot {
  notices: string[];
  readings: DiagnosticReading[];
}

export function formatMeasured(value: number | null): string {
  if (value === null) return NOT_MEASURED;
  return String(value);
}

export function createBootstrapDiagnostics(): DiagnosticsSnapshot {
  const audio: AudioDiagnostics = new PlaceholderAudioEngine().getDiagnostics();
  const selection: AudioDeviceSelection = new PlaceholderAudioDeviceManager().getSelection();
  const sync: ClockSyncSnapshot = new PlaceholderClockSynchronizer().read();

  return {
    notices: [
      "LiveKit, WebRTC, Supabase, and recording are outside this slice.",
      "Empty metrics are unmeasured. They are not zero.",
    ],
    readings: [
      reading("sample-rate", "Sample rate", formatMeasured(audio.sampleRate), "audio"),
      reading("base-latency", "Base latency", formatMeasured(audio.baseLatencySeconds), "audio"),
      reading("output-latency", "Output latency", formatMeasured(audio.outputLatencySeconds), "audio"),
      reading("input-channels", "Input channels", formatMeasured(audio.inputChannelCount), "audio"),
      reading("device-profile", "Device profile", "not resolved", "device"),
      reading("selected-input", "Selected input", selection.inputDeviceId ?? "not selected", "device"),
      reading("selected-output", "Selected output", selection.outputDeviceId ?? "not selected", "device"),
      reading("rtt", "Network RTT", NOT_MEASURED, "network"),
      reading("jitter", "Jitter", NOT_MEASURED, "network"),
      reading("packet-loss", "Packet loss", NOT_MEASURED, "network"),
      reading("sync-offset", "Sync offset", formatMeasured(sync.offsetSeconds), "sync"),
      reading("drift", "Drift", formatMeasured(sync.driftSeconds), "sync"),
    ],
  };
}

function reading(
  id: string,
  label: string,
  value: string,
  group: DiagnosticGroup,
): DiagnosticReading {
  return { id, label, value, group };
}
