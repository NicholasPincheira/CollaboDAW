import type { ControlPlaneMetrics } from "../../domain/session/control-plane-probe.ts";
import {
  classifyLocalMonitorPathMs,
  localMonitorBandLabel,
  softwareMonitorPathMs,
} from "../../domain/audio/latency-bands.ts";
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

  const pathMs = softwareMonitorPathMs(
    snapshot.diagnostics.baseLatencySeconds,
    snapshot.diagnostics.outputLatencySeconds,
  );
  const band = classifyLocalMonitorPathMs(pathMs);

  const readings: DiagnosticReading[] = [
    {
      id: "sample-rate",
      label: "Sample rate",
      value: formatHz(snapshot.diagnostics.sampleRate),
      group: "audio",
    },
    {
      id: "base-latency",
      label: "baseLatencyMs",
      value: formatMs(snapshot.diagnostics.baseLatencySeconds),
      group: "audio",
    },
    {
      id: "output-latency",
      label: "outputLatencyMs",
      value: snapshot.capabilities.outputLatency
        ? formatMs(snapshot.diagnostics.outputLatencySeconds)
        : "unsupported",
      group: "audio",
    },
    {
      id: "local-monitor-path",
      label: "localMonitorPathMs (partial)",
      value: formatPath(pathMs),
      group: "audio",
    },
    {
      id: "local-monitor-band",
      label: "ADR-018 local band",
      value: localMonitorBandLabel(band),
      group: "audio",
    },
    {
      id: "subjective-feel",
      label: "Subjective feel 1–5",
      value:
        snapshot.subjectiveFeel1to5 === null
          ? "not scored — use ① Direct / ② Soft then tap 1–5"
          : `${snapshot.subjectiveFeel1to5} / 5`,
      group: "audio",
    },
    {
      id: "experience-preset",
      label: "Experience preset",
      value: snapshot.experiencePresetId,
      group: "audio",
    },
    {
      id: "ai-assist",
      label: "IA assist",
      value: snapshot.aiAssistMode,
      group: "audio",
    },
    {
      id: "latency-hint",
      label: "latencyHint (request)",
      value: snapshot.latencyMode,
      group: "audio",
    },
    {
      id: "software-monitor",
      label: "Software monitor",
      value: snapshot.monitoring ? "on" : "off",
      group: "audio",
    },
    {
      id: "direct-monitor",
      label: "Direct Monitor (HW)",
      value: "user-managed on interface · not controlled by Web Audio",
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
      label: "Input channels (getSettings)",
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
      label: "networkRttMs (control)",
      value: formatProbeMs(control?.rttMs ?? null),
      group: "network",
    },
    {
      id: "jitter",
      label: "networkJitterMs (control)",
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
      id: "remote-one-way",
      label: "remoteOneWayEstimateMs",
      value: "not measured (needs WebRTC media)",
      group: "network",
    },
    {
      id: "sync-offset",
      label: "clockOffsetMs",
      value: "not measured (needs WebRTC SessionClock)",
      group: "sync",
    },
    {
      id: "drift",
      label: "clockDrift",
      value: "not measured (needs WebRTC SessionClock)",
      group: "sync",
    },
  ];

  return {
    notices: [
      ...snapshot.notices,
      "LOCAL MONITOR target (ADR-018): <15 ms preferred · path is base+output only, not instrument→ear.",
      "REMOTE one-way target: <=30 ms — unavailable until media plane.",
      `setSinkId: ${snapshot.capabilities.setSinkId ? "available" : "unavailable"}`,
      control?.lastError ? `Control probe: ${control.lastError}` : "Control probe ready (Measure network).",
      snapshot.error ? `Error: ${snapshot.error.message}` : "Audio Lab errors will appear here.",
      "Baseline benchmarks: keep IA assist = off. Template: docs/research/HARDWARE-BENCHMARK-TEMPLATE.md",
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

function formatPath(pathMs: number | null): string {
  if (pathMs === null) return NOT_MEASURED;
  return `${pathMs.toFixed(1)} ms (base+out · not instrument→ear)`;
}
