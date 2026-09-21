import type { ControlPlaneMetrics } from "../../domain/session/control-plane-probe.ts";
import type { AudioLabSnapshot } from "./audio-lab-controller.ts";
import {
  NOT_MEASURED,
  type DiagnosticsSnapshot,
  formatMeasured,
  type DiagnosticReading,
} from "../bootstrap-diagnostics.ts";

export function diagnosticsFromAudioLab(
  snapshot: AudioLabSnapshot,
  control: ControlPlaneMetrics | null = null,
): DiagnosticsSnapshot {
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
      id: "roundtrip-estimate",
      label: "Est. monitor path",
      value: formatRoundTrip(
        snapshot.diagnostics.baseLatencySeconds,
        snapshot.diagnostics.outputLatencySeconds,
      ),
      group: "audio",
    },
    {
      id: "latency-preset",
      label: "Latency preset",
      value: snapshot.latencyMode,
      group: "audio",
    },
    {
      id: "preferred-sr",
      label: "Preferred sample rate",
      value: snapshot.preferredSampleRate ? `${snapshot.preferredSampleRate} Hz` : "browser default",
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
    {
      id: "rtt",
      label: "Control RTT (Supabase)",
      value: formatProbeMs(control?.rttMs ?? null),
      group: "network",
    },
    {
      id: "jitter",
      label: "Control jitter",
      value: formatProbeMs(control?.jitterMs ?? null),
      group: "network",
    },
    {
      id: "packet-loss",
      label: "Control packet loss",
      value:
        control?.packetLossPct === null || control?.packetLossPct === undefined
          ? NOT_MEASURED
          : `${control.packetLossPct.toFixed(1)}%`,
      group: "network",
    },
    {
      id: "sync-offset",
      label: "Sync offset",
      value: "not measured (needs WebRTC SessionClock)",
      group: "sync",
    },
    {
      id: "drift",
      label: "Drift",
      value: "not measured (needs WebRTC SessionClock)",
      group: "sync",
    },
  ];

  return {
    notices: [
      ...snapshot.notices,
      `setSinkId: ${snapshot.capabilities.setSinkId ? "available" : "unavailable"}`,
      control?.lastError ? `Control probe: ${control.lastError}` : "Control probe ready (Measure network).",
      snapshot.error ? `Error: ${snapshot.error.message}` : "Audio Lab errors will appear here.",
      "Supabase free tier: keep probes small — no PCM in Postgres, presence/control only.",
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

function formatProbeMs(value: number | null): string {
  if (value === null) return NOT_MEASURED;
  return `${value.toFixed(1)} ms`;
}

function formatRoundTrip(base: number | null, output: number | null): string {
  if (base === null && output === null) return NOT_MEASURED;
  const total = (base ?? 0) + (output ?? 0);
  return `${(total * 1000).toFixed(1)} ms (base+out · not instrument→ear)`;
}
