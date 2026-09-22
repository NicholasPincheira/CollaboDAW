import type { LatencyMode } from "../../infrastructure/audio/web-audio-lab-engine.ts";
import type { AudioLabController, AudioLabSnapshot } from "../audio-lab/audio-lab-controller.ts";
import type { ControlPlaneMetrics } from "../../domain/session/control-plane-probe.ts";
import {
  classifyLocalMonitorPathMs,
  softwareMonitorPathMs,
} from "../../domain/audio/latency-bands.ts";

export interface LatencyCandidateResult {
  latencyMode: LatencyMode;
  sampleRate: number | null;
  pathMs: number | null;
  baseMs: number | null;
  outputMs: number | null;
  sampleRateHz: number | null;
}

export interface AutoTuneReport {
  tried: LatencyCandidateResult[];
  best: LatencyCandidateResult | null;
  applied: boolean;
  note: string;
}

const CANDIDATES: Array<{ latencyMode: LatencyMode; sampleRate: number | null }> = [
  { latencyMode: "live", sampleRate: 48000 },
  { latencyMode: "live", sampleRate: 44100 },
  { latencyMode: "record", sampleRate: 48000 },
];

/** Try a few AudioContext configs and keep the lowest measured base+output path. */
export async function autoTuneMonitorPath(controller: AudioLabController): Promise<AutoTuneReport> {
  if (controller.getSnapshot().status !== "running" && !controller.getSnapshot().inputDeviceId) {
    return {
      tried: [],
      best: null,
      applied: false,
      note: "Select an input and start audio before auto-tune.",
    };
  }

  const tried: LatencyCandidateResult[] = [];
  for (const candidate of CANDIDATES) {
    await controller.setPreferredSampleRate(candidate.sampleRate);
    await controller.setLatencyMode(candidate.latencyMode);
    if (controller.getSnapshot().status !== "running") {
      await controller.startAudio();
    }
    await sleep(350);
    const snap = controller.getSnapshot();
    tried.push(scoreSnapshot(snap, candidate.latencyMode, candidate.sampleRate));
  }

  const ranked = [...tried]
    .filter((item) => item.pathMs !== null)
    .sort((a, b) => (a.pathMs ?? 9e9) - (b.pathMs ?? 9e9));
  const best = ranked[0] ?? null;
  if (!best) {
    return {
      tried,
      best: null,
      applied: false,
      note: "Could not measure path latency. Is audio running?",
    };
  }

  await controller.setPreferredSampleRate(best.sampleRate);
  await controller.setLatencyMode(best.latencyMode);
  if (controller.getSnapshot().status !== "running") {
    await controller.startAudio();
  }

  const band = classifyLocalMonitorPathMs(best.pathMs);
  return {
    tried,
    best,
    applied: true,
    note: `Applied ${best.latencyMode} @ ${best.sampleRate ?? "auto"} → ${best.pathMs?.toFixed(1)} ms localMonitorPath (partial) · band ${band}. Prefer Direct Monitor ON + software monitor OFF for playing feel.`,
  };
}

export function buildDebugBundle(input: {
  lab: AudioLabSnapshot;
  control: ControlPlaneMetrics;
  autoTune: AutoTuneReport | null;
  sessionId: string;
}): string {
  const baseMs =
    input.lab.diagnostics.baseLatencySeconds === null
      ? null
      : input.lab.diagnostics.baseLatencySeconds * 1000;
  const outputMs =
    input.lab.diagnostics.outputLatencySeconds === null
      ? null
      : input.lab.diagnostics.outputLatencySeconds * 1000;
  const localMonitorPathMs = softwareMonitorPathMs(
    input.lab.diagnostics.baseLatencySeconds,
    input.lab.diagnostics.outputLatencySeconds,
  );
  const localMonitorBand = classifyLocalMonitorPathMs(localMonitorPathMs);

  return JSON.stringify(
    {
      schema: "collabodaw.hardware-benchmark.v1",
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      sessionId: input.sessionId,
      benchmark: {
        aiAssistMode: input.lab.aiAssistMode,
        experiencePresetId: input.lab.experiencePresetId,
        latencyHint: input.lab.latencyMode,
        preferredSampleRate: input.lab.preferredSampleRate,
        softwareMonitor: input.lab.monitoring,
        directMonitorHardware: "user-managed",
        baseLatencyMs: baseMs,
        outputLatencyMs: outputMs,
        localMonitorPathMs,
        localMonitorBand,
        adr018LocalTargetMs: 15,
        adr018RemoteOneWayTargetMs: 30,
        sampleRateHz: input.lab.diagnostics.sampleRate,
        inputChannelCount: input.lab.diagnostics.inputChannelCount,
        inputLabel: labelFor(input.lab, input.lab.inputDeviceId),
        outputLabel: labelFor(input.lab, input.lab.outputDeviceId),
        profile: input.lab.profile
          ? {
              id: input.lab.profile.id,
              manufacturer: input.lab.profile.manufacturer,
              model: input.lab.profile.model,
            }
          : null,
        sinkStatus: input.lab.sinkStatus,
        secondarySinkStatus: input.lab.secondarySinkStatus,
        routingHint: routingHint(input.lab),
        subjectiveFeel1to5: null,
        notes: "Fill subjectiveFeel1to5 after playing a short phrase. Keep AI off for baseline.",
      },
      audio: {
        status: input.lab.status,
        experiencePresetId: input.lab.experiencePresetId,
        aiAssistMode: input.lab.aiAssistMode,
        latencyMode: input.lab.latencyMode,
        preferredSampleRate: input.lab.preferredSampleRate,
        monitoring: input.lab.monitoring,
        diagnostics: input.lab.diagnostics,
        pathMs: localMonitorPathMs,
        sinkStatus: input.lab.sinkStatus,
        secondarySinkStatus: input.lab.secondarySinkStatus,
        inputDeviceId: input.lab.inputDeviceId,
        outputDeviceId: input.lab.outputDeviceId,
        secondaryOutputDeviceId: input.lab.secondaryOutputDeviceId,
        inputLabel: labelFor(input.lab, input.lab.inputDeviceId),
        outputLabel: labelFor(input.lab, input.lab.outputDeviceId),
        routingHint: routingHint(input.lab),
      },
      controlPlane: input.control,
      autoTune: input.autoTune,
      notices: input.lab.notices,
    },
    null,
    2,
  );
}

function scoreSnapshot(
  snap: AudioLabSnapshot,
  latencyMode: LatencyMode,
  sampleRate: number | null,
): LatencyCandidateResult {
  const base = snap.diagnostics.baseLatencySeconds;
  const output = snap.diagnostics.outputLatencySeconds;
  return {
    latencyMode,
    sampleRate,
    baseMs: base === null ? null : base * 1000,
    outputMs: output === null ? null : output * 1000,
    pathMs: softwareMonitorPathMs(base, output),
    sampleRateHz: snap.diagnostics.sampleRate,
  };
}

function labelFor(lab: AudioLabSnapshot, id: string | null): string | null {
  if (!id) return null;
  return lab.devices.find((device) => device.deviceId === id)?.label ?? id;
}

function routingHint(lab: AudioLabSnapshot): string {
  const input = labelFor(lab, lab.inputDeviceId)?.toLowerCase() ?? "";
  const output = labelFor(lab, lab.outputDeviceId)?.toLowerCase() ?? "";
  const inputIsInterface =
    input.includes("behringer") || input.includes("focusrite") || input.includes("scarlett");
  const outputIsSameFamily =
    (input.includes("behringer") && output.includes("behringer")) ||
    (input.includes("focusrite") && output.includes("focusrite")) ||
    (input.includes("scarlett") && output.includes("scarlett"));
  if (inputIsInterface && !outputIsSameFamily) {
    return "Input is the interface but primary output is not — set Primary output to the interface to cut Windows mixer delay.";
  }
  if (lab.latencyMode !== "live") {
    return "latencyHint is not live — switch to Feel / live for monitoring tests.";
  }
  return "Routing looks aligned for a software-monitor test.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
