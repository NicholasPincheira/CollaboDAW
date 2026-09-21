import type { AudioLabSnapshot } from "./audio-lab-controller.ts";
import {
  NOT_MEASURED,
  type DiagnosticsSnapshot,
  formatMeasured,
  type DiagnosticReading,
} from "../bootstrap-diagnostics.ts";

export function diagnosticsFromAudioLab(snapshot: AudioLabSnapshot): DiagnosticsSnapshot {
  const profileLabel = snapshot.profile
    ? `${snapshot.profile.manufacturer} ${snapshot.profile.model}`
    : snapshot.inputDeviceId
      ? "Generic multichannel"
      : "not resolved";

  const inputLabel =
    snapshot.devices.find((device) => device.deviceId === snapshot.inputDeviceId)?.label ??
    (snapshot.inputDeviceId ? snapshot.inputDeviceId : "not selected");
  const outputLabel =
    snapshot.devices.find((device) => device.deviceId === snapshot.outputDeviceId)?.label ??
    (snapshot.outputDeviceId ? snapshot.outputDeviceId : "not selected");

  const readings: DiagnosticReading[] = [
    {
      id: "sample-rate",
      label: "Sample rate",
      value: formatHz(snapshot.diagnostics.sampleRate),
      group: "audio",
    },
    {
      id: "base-latency",
      label: "Base latency",
      value: formatMs(snapshot.diagnostics.baseLatencySeconds),
      group: "audio",
    },
    {
      id: "output-latency",
      label: "Output latency",
      value: snapshot.capabilities.outputLatency
        ? formatMs(snapshot.diagnostics.outputLatencySeconds)
        : "unsupported",
      group: "audio",
    },
    {
      id: "input-channels",
      label: "Input channels",
      value: formatMeasured(snapshot.diagnostics.inputChannelCount),
      group: "audio",
    },
    { id: "device-profile", label: "Device profile", value: profileLabel, group: "device" },
    { id: "selected-input", label: "Selected input", value: inputLabel, group: "device" },
    {
      id: "selected-output",
      label: "Selected output",
      value: `${outputLabel} (${snapshot.sinkStatus})`,
      group: "device",
    },
    { id: "rtt", label: "Network RTT", value: NOT_MEASURED, group: "network" },
    { id: "jitter", label: "Jitter", value: NOT_MEASURED, group: "network" },
    { id: "packet-loss", label: "Packet loss", value: NOT_MEASURED, group: "network" },
    { id: "sync-offset", label: "Sync offset", value: NOT_MEASURED, group: "sync" },
    { id: "drift", label: "Drift", value: NOT_MEASURED, group: "sync" },
  ];

  return {
    notices: [
      ...snapshot.notices,
      `setSinkId: ${snapshot.capabilities.setSinkId ? "available" : "unavailable"}`,
      snapshot.error ? `Error: ${snapshot.error.message}` : "Audio Lab errors will appear here.",
    ],
    readings,
  };
}

function formatHz(value: number | null): string {
  if (value === null) return NOT_MEASURED;
  return `${Math.round(value)} Hz`;
}

function formatMs(value: number | null): string {
  if (value === null) return NOT_MEASURED;
  return `${(value * 1000).toFixed(2)} ms`;
}
