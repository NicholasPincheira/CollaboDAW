import type { AudioDeviceDescriptor } from "../../domain/audio/audio-device-manager.ts";
import type { ChannelMap, ChannelMapEntry } from "../../domain/audio/channel-mapper.ts";
import { applyChannelMapOverrides } from "../../domain/audio/channel-mapping-overrides.ts";
import type { ChannelMappingOverrideStore } from "../../domain/audio/channel-mapping-overrides.ts";
import type {
  AudioLabError,
  AudioLabStatus,
  ChannelMeterReading,
  LearnInputState,
} from "../../domain/audio/audio-lab-types.ts";
import type { AudioHardwareProfile } from "../../domain/audio/hardware-profile.ts";
import {
  DEFAULT_AI_ASSIST_MODE,
  DEFAULT_EXPERIENCE_PRESET_ID,
  buildExperienceNotices,
  getExperiencePreset,
  isSubjectiveFeelScore,
  type AiAssistMode,
  type ExperiencePresetId,
  type SubjectiveFeelScore,
} from "../../domain/audio/experience-presets.ts";
import { normalizeDeviceLabel } from "../../domain/audio/known-profiles.ts";
import { pickStrongestChannel } from "../../domain/audio/signal-analysis.ts";
import { DefaultChannelMapper } from "../../domain/audio/default-channel-mapper.ts";
import { StaticAudioDeviceProfileRegistry } from "../../domain/audio/static-profile-registry.ts";
import type { AudioDiagnostics } from "../../domain/audio/audio-engine.ts";
import type { BrowserAudioCapabilities } from "../../infrastructure/audio/detect-browser-capabilities.ts";
import { detectBrowserAudioCapabilities } from "../../infrastructure/audio/detect-browser-capabilities.ts";
import { BrowserAudioDeviceManager } from "../../infrastructure/audio/browser-audio-device-manager.ts";
import { LocalChannelMappingOverrideStore } from "../../infrastructure/audio/local-mapping-overrides.ts";
import { LocalClickScheduler } from "../../infrastructure/audio/local-click-scheduler.ts";
import type { AudioRecorderPhase } from "../../domain/audio/audio-recorder.ts";
import { MediaRecorderAudioRecorder } from "../../infrastructure/audio/media-recorder-audio-recorder.ts";
import {
  WebAudioLabEngine,
  type ChannelMonitorState,
  type LatencyMode,
} from "../../infrastructure/audio/web-audio-lab-engine.ts";

export interface AudioLabTake {
  blob: Blob;
  objectUrl: string;
  mimeType: string;
  createdAt: string;
  byteLength: number;
}

export interface AudioLabSnapshot {
  status: AudioLabStatus;
  error: AudioLabError | null;
  capabilities: BrowserAudioCapabilities;
  devices: AudioDeviceDescriptor[];
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  secondaryOutputDeviceId: string | null;
  profile: AudioHardwareProfile | null;
  channelMap: ChannelMap;
  diagnostics: AudioDiagnostics;
  meters: ChannelMeterReading[];
  monitoring: boolean;
  channelMonitors: ChannelMonitorState[];
  latencyMode: LatencyMode;
  preferredSampleRate: number | null;
  experiencePresetId: ExperiencePresetId;
  aiAssistMode: AiAssistMode;
  /** Subjective playing feel for the active preset (A/B). Null until scored. */
  subjectiveFeel1to5: SubjectiveFeelScore | null;
  sinkStatus: "default" | "applied" | "unsupported" | "failed";
  secondarySinkStatus: "off" | "applied" | "unsupported" | "failed";
  clickPlaying: boolean;
  recordingPhase: AudioRecorderPhase;
  lastTake: AudioLabTake | null;
  learn: LearnInputState;
  notices: string[];
}

type Listener = () => void;

export class AudioLabController {
  private readonly devices: BrowserAudioDeviceManager;
  private readonly engine: WebAudioLabEngine;
  private readonly recorder: MediaRecorderAudioRecorder;
  private readonly click: LocalClickScheduler;
  private readonly registry: StaticAudioDeviceProfileRegistry;
  private readonly mapper: DefaultChannelMapper;
  private readonly overrides: ChannelMappingOverrideStore;
  private readonly listeners = new Set<Listener>();
  private peakScratch = new Float32Array(8);
  private learnPeaks = new Float32Array(8);
  private learnTimer: ReturnType<typeof setTimeout> | null = null;
  private unbindDeviceChange: (() => void) | null = null;

  private snapshot: AudioLabSnapshot;

  constructor(options?: {
    devices?: BrowserAudioDeviceManager;
    engine?: WebAudioLabEngine;
    overrides?: ChannelMappingOverrideStore;
    recorder?: MediaRecorderAudioRecorder;
  }) {
    this.devices = options?.devices ?? new BrowserAudioDeviceManager();
    this.engine = options?.engine ?? new WebAudioLabEngine();
    this.recorder = options?.recorder ?? new MediaRecorderAudioRecorder();
    this.click = new LocalClickScheduler(
      () => this.engine.getAudioContext(),
      () => this.engine.getMonitorTap(),
    );
    this.registry = new StaticAudioDeviceProfileRegistry();
    this.mapper = new DefaultChannelMapper();
    this.overrides = options?.overrides ?? new LocalChannelMappingOverrideStore();

    this.snapshot = {
      status: "idle",
      error: null,
      capabilities: detectBrowserAudioCapabilities(),
      devices: [],
      inputDeviceId: null,
      outputDeviceId: null,
      secondaryOutputDeviceId: null,
      profile: null,
      channelMap: { mode: "unmeasured", requiresRuntimeValidation: true, entries: [] },
      diagnostics: emptyDiagnostics(),
      meters: [],
      monitoring: false,
      channelMonitors: [],
      latencyMode: "live",
      preferredSampleRate: 48000,
      experiencePresetId: DEFAULT_EXPERIENCE_PRESET_ID,
      aiAssistMode: DEFAULT_AI_ASSIST_MODE,
      subjectiveFeel1to5: null,
      sinkStatus: "default",
      secondarySinkStatus: "off",
      clickPlaying: false,
      recordingPhase: "idle",
      lastTake: null,
      learn: idleLearn(),
      notices: [
        ...buildExperienceNotices(
          getExperiencePreset(DEFAULT_EXPERIENCE_PRESET_ID),
          DEFAULT_AI_ASSIST_MODE,
        ),
        "Dual output uses primary AudioContext sink + secondary <audio> sink (Chromium). Devices are not sample-locked.",
        "LiveKit / WebRTC audio sync is still outside this slice; presence uses Supabase Realtime.",
      ],
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): AudioLabSnapshot {
    return this.snapshot;
  }

  async initialize(): Promise<void> {
    const capabilities = detectBrowserAudioCapabilities();
    this.patch({ capabilities });
    if (!capabilities.mediaDevices || !capabilities.getUserMedia || !capabilities.audioContext) {
      this.patch({
        status: "error",
        error: {
          code: "unsupported",
          message: "This browser cannot run the Audio Lab. Use Chromium desktop over HTTPS.",
        },
      });
      return;
    }

    this.unbindDeviceChange?.();
    this.unbindDeviceChange = this.devices.onDeviceChange(() => {
      void this.refreshDevices();
    });
    await this.refreshDevices();
    this.patch({ status: this.snapshot.devices.length > 0 ? "ready" : "idle" });
  }

  async requestPermission(): Promise<void> {
    this.patch({ status: "requesting-permission", error: null });
    try {
      const result = await this.devices.requestPermission();
      if (result === "denied") {
        this.patch({
          status: "error",
          error: { code: "permission-denied", message: "Microphone permission was denied." },
        });
        return;
      }
      if (result === "unsupported") {
        this.patch({
          status: "error",
          error: { code: "unsupported", message: "getUserMedia is unavailable." },
        });
        return;
      }
      await this.refreshDevices();
      this.autoSelectDefaults();
      this.patch({ status: "ready", error: null });
    } catch (error) {
      this.patch({
        status: "error",
        error: {
          code: "unknown",
          message: error instanceof Error ? error.message : "Permission request failed.",
        },
      });
    }
  }

  async refreshDevices(): Promise<void> {
    const devices = await this.devices.enumerate();
    this.patch({ devices });
    this.resolveProfileForSelection();
  }

  selectInput(deviceId: string): void {
    this.devices.selectInput(deviceId);
    this.patch({ inputDeviceId: deviceId });
    this.resolveProfileForSelection();
  }

  selectOutput(deviceId: string): void {
    this.devices.selectOutput(deviceId);
    this.patch({ outputDeviceId: deviceId || null });
    if (this.snapshot.status === "running") {
      void this.engine.setSinkId(deviceId).then((result) => {
        this.patch({ sinkStatus: result === "applied" ? "applied" : result });
      });
    }
  }

  selectSecondaryOutput(deviceId: string): void {
    this.patch({ secondaryOutputDeviceId: deviceId || null });
    if (this.snapshot.status === "running") {
      void this.engine.setSecondarySinkId(deviceId).then((result) => {
        this.patch({
          secondarySinkStatus:
            !deviceId ? "off" : result === "applied" ? "applied" : result,
        });
      });
    }
  }

  async setLatencyMode(mode: LatencyMode): Promise<void> {
    const wasRunning = this.snapshot.status === "running";
    this.click.stop();
    await this.engine.configurePerformance({ latencyMode: mode });
    this.patch({ latencyMode: mode, clickPlaying: false });
    if (wasRunning) {
      await this.startAudio();
    }
  }

  async setPreferredSampleRate(sampleRate: number | null): Promise<void> {
    const wasRunning = this.snapshot.status === "running";
    this.click.stop();
    await this.engine.configurePerformance({ sampleRate });
    this.patch({ preferredSampleRate: sampleRate, clickPlaying: false });
    if (wasRunning) {
      await this.startAudio();
    }
  }

  /**
   * Apply a coherent experience bundle (latency mode + SR + software monitor + tips).
   * A/B presets force IA off and clear the feel score so you re-rate after playing.
   */
  async applyExperiencePreset(id: ExperiencePresetId): Promise<void> {
    const preset = getExperiencePreset(id);
    const wasRunning = this.snapshot.status === "running";
    const aiAssistMode = preset.forceAiOff ? "off" : this.snapshot.aiAssistMode;
    this.click.stop();
    await this.engine.configurePerformance({
      latencyMode: preset.audio.latencyMode,
      sampleRate: preset.audio.preferredSampleRate,
    });
    this.engine.setMonitoring(preset.audio.softwareMonitoring);
    this.patch({
      experiencePresetId: id,
      latencyMode: preset.audio.latencyMode,
      preferredSampleRate: preset.audio.preferredSampleRate,
      monitoring: preset.audio.softwareMonitoring,
      aiAssistMode,
      subjectiveFeel1to5: null,
      clickPlaying: false,
      notices: [
        ...buildExperienceNotices(preset, aiAssistMode),
        "Dual output uses primary AudioContext sink + secondary <audio> sink (Chromium). Devices are not sample-locked.",
        "LiveKit / WebRTC audio sync is still outside this slice; presence uses Supabase Realtime.",
      ],
    });
    if (wasRunning) {
      await this.startAudio();
      // Re-assert after graph rebuild so Soft/Direct mon state cannot drift.
      this.engine.setMonitoring(preset.audio.softwareMonitoring);
      this.patch({ monitoring: preset.audio.softwareMonitoring });
    }
  }

  /** Store subjective feel 1–5 for the active preset (exported in benchmark JSON). */
  setSubjectiveFeel(score: SubjectiveFeelScore | null): void {
    if (score !== null && !isSubjectiveFeelScore(score)) {
      return;
    }
    this.patch({ subjectiveFeel1to5: score });
  }

  /** Store AI preference without forcing DSP. Stubs stay inactive until media path exists. */
  setAiAssistMode(mode: AiAssistMode): void {
    const preset = getExperiencePreset(this.snapshot.experiencePresetId);
    this.patch({
      aiAssistMode: mode,
      notices: [
        ...buildExperienceNotices(preset, mode),
        "Dual output uses primary AudioContext sink + secondary <audio> sink (Chromium). Devices are not sample-locked.",
        "LiveKit / WebRTC audio sync is still outside this slice; presence uses Supabase Realtime.",
      ],
    });
  }

  setChannelMonitor(streamChannel: number, state: Partial<ChannelMonitorState>): void {
    this.engine.setChannelMonitor(streamChannel, state);
    this.patch({ channelMonitors: this.engine.getChannelMonitors() });
  }

  startClick(bpm: number, beatsPerBar: number): void {
    try {
      this.click.start(bpm, beatsPerBar);
      this.patch({ clickPlaying: true, error: null });
    } catch (error) {
      this.patch({
        error: {
          code: "unknown",
          message: error instanceof Error ? error.message : "Could not start click.",
        },
      });
    }
  }

  stopClick(): void {
    this.click.stop();
    this.patch({ clickPlaying: false });
  }

  updateClickTempo(bpm: number, beatsPerBar: number): void {
    this.click.setTempo(bpm, beatsPerBar);
  }

  async startAudio(): Promise<void> {
    const inputId = this.snapshot.inputDeviceId;
    if (!inputId) {
      this.patch({
        status: "error",
        error: { code: "invalid-device", message: "Select an input device first." },
      });
      return;
    }

    this.patch({ status: "starting", error: null });
    try {
      this.click.stop();
      await this.engine.stop();
      await this.engine.setLatencyMode(this.snapshot.latencyMode);
      const stream = await this.devices.openInputStream(inputId, 2);
      await this.engine.attachInput(stream);
      await this.engine.start();

      if (this.engine.state === "suspended") {
        this.patch({
          status: "error",
          error: {
            code: "context-suspended",
            message: "AudioContext is suspended. Interact with the page and start again.",
          },
        });
        return;
      }

      const channelCount = this.engine.getExposedChannelCount();
      const profile = this.snapshot.profile;
      const base = this.mapper.build({ profile, exposedChannelCount: channelCount });
      const deviceKey = this.deviceKey();
      const overrides = deviceKey ? this.overrides.get(deviceKey) : null;
      const entries = applyChannelMapOverrides(base.entries, overrides);
      const channelMap: ChannelMap = { ...base, entries };

      let sinkStatus: AudioLabSnapshot["sinkStatus"] = "default";
      if (this.snapshot.outputDeviceId) {
        const result = await this.engine.setSinkId(this.snapshot.outputDeviceId);
        sinkStatus = result === "applied" ? "applied" : result;
      } else if (!this.snapshot.capabilities.setSinkId) {
        sinkStatus = "unsupported";
      }

      let secondarySinkStatus: AudioLabSnapshot["secondarySinkStatus"] = "off";
      if (this.snapshot.secondaryOutputDeviceId) {
        const result = await this.engine.setSecondarySinkId(this.snapshot.secondaryOutputDeviceId);
        secondarySinkStatus = result === "applied" ? "applied" : result;
      }

      this.engine.setMonitoring(this.snapshot.monitoring);
      this.ensurePeakScratch(channelCount);
      this.patch({
        status: "running",
        channelMap,
        diagnostics: this.engine.getDiagnostics(),
        sinkStatus,
        secondarySinkStatus,
        channelMonitors: this.engine.getChannelMonitors(),
        clickPlaying: false,
        meters: entriesToMeters(entries, channelCount, this.peakScratch),
      });
    } catch (error) {
      await this.engine.stop();
      this.patch({
        status: "error",
        error: toLabError(error),
        diagnostics: emptyDiagnostics(),
        meters: [],
        channelMonitors: [],
        clickPlaying: false,
      });
    }
  }

  async stopAudio(): Promise<void> {
    this.patch({ status: "stopping" });
    this.cancelLearn();
    this.click.stop();
    if (this.recorder.getPhase() === "recording") {
      try {
        await this.recorder.stop();
      } catch {
        /* discard interrupted take when tearing down audio */
      }
      this.patch({ recordingPhase: "idle" });
    }
    await this.engine.stop();
    this.patch({
      status: "ready",
      diagnostics: emptyDiagnostics(),
      meters: [],
      channelMonitors: [],
      clickPlaying: false,
      recordingPhase: "idle",
      error: null,
    });
  }

  /** Dry tap → MediaRecorder. Independent of software monitor / HW Direct. */
  async startRecording(): Promise<void> {
    if (this.snapshot.status !== "running") {
      this.patch({
        error: {
          code: "unknown",
          message: "Start audio before recording.",
        },
      });
      return;
    }
    const dry = this.engine.getDryRecordStream();
    if (!dry) {
      this.patch({
        error: {
          code: "unknown",
          message: "Dry record tap is not available.",
        },
      });
      return;
    }
    try {
      await this.recorder.start(dry);
      this.patch({
        recordingPhase: "recording",
        error: null,
        notices: [
          "Recording dry tap (pre-monitor). HW Direct / Web Mon do not change the take.",
          ...this.snapshot.notices.filter((line) => !line.startsWith("Recording dry")),
        ].slice(0, 8),
      });
    } catch (error) {
      this.patch({
        recordingPhase: "idle",
        error: {
          code: "unknown",
          message: error instanceof Error ? error.message : "Could not start recording.",
        },
      });
    }
  }

  async stopRecording(): Promise<void> {
    if (this.recorder.getPhase() !== "recording") return;
    try {
      const blob = await this.recorder.stop();
      if (this.snapshot.lastTake?.objectUrl) {
        URL.revokeObjectURL(this.snapshot.lastTake.objectUrl);
      }
      const objectUrl = URL.createObjectURL(blob);
      this.patch({
        recordingPhase: "idle",
        lastTake: {
          blob,
          objectUrl,
          mimeType: blob.type || "audio/webm",
          createdAt: new Date().toISOString(),
          byteLength: blob.size,
        },
        error: null,
      });
    } catch (error) {
      this.patch({
        recordingPhase: "idle",
        error: {
          code: "unknown",
          message: error instanceof Error ? error.message : "Could not stop recording.",
        },
      });
    }
  }

  clearLastTake(): void {
    if (this.snapshot.lastTake?.objectUrl) {
      URL.revokeObjectURL(this.snapshot.lastTake.objectUrl);
    }
    this.patch({ lastTake: null });
  }

  /** Call from a visualization frame. Does not own musical timing. */
  pollMeters(): void {
    if (this.snapshot.status !== "running") return;
    const count = this.engine.getExposedChannelCount();
    this.ensurePeakScratch(count);
    this.engine.readPeaks(this.peakScratch);

    if (this.snapshot.learn.phase === "listening") {
      for (let i = 0; i < count; i += 1) {
        const value = this.peakScratch[i] ?? 0;
        if (value > (this.learnPeaks[i] ?? 0)) {
          this.learnPeaks[i] = value;
        }
      }
    }

    this.patch({
      diagnostics: this.engine.getDiagnostics(),
      meters: entriesToMeters(this.snapshot.channelMap.entries, count, this.peakScratch),
      learn:
        this.snapshot.learn.phase === "listening"
          ? {
              ...this.snapshot.learn,
              peaks: Array.from(this.learnPeaks.subarray(0, count)),
            }
          : this.snapshot.learn,
    });
  }

  setMonitoring(enabled: boolean): void {
    this.engine.setMonitoring(enabled);
    this.patch({ monitoring: enabled });
  }

  remapChannel(label: string, streamChannel: number | null): void {
    const entries = this.snapshot.channelMap.entries.map((entry) =>
      entry.label === label
        ? { ...entry, streamChannel, source: "manual" as const }
        : { ...entry },
    );
    this.persistAndApply(entries);
  }

  startLearnInput(roleLabel: string): void {
    if (this.snapshot.status !== "running") {
      this.patch({
        learn: {
          phase: "idle",
          roleLabel: null,
          strongestChannel: null,
          peaks: [],
          message: "Start audio before learning an input.",
        },
      });
      return;
    }

    const count = this.engine.getExposedChannelCount();
    this.learnPeaks = new Float32Array(count);
    this.learnPeaks.fill(0);
    this.patch({
      learn: {
        phase: "listening",
        roleLabel,
        strongestChannel: null,
        peaks: Array.from(this.learnPeaks),
        message: `Play a signal into "${roleLabel}". Listening for the strongest exposed channel…`,
      },
    });

    if (this.learnTimer) clearTimeout(this.learnTimer);
    this.learnTimer = setTimeout(() => {
      const strongest = pickStrongestChannel(Array.from(this.learnPeaks));
      this.patch({
        learn: {
          phase: strongest === null ? "idle" : "awaiting-confirm",
          roleLabel,
          strongestChannel: strongest,
          peaks: Array.from(this.learnPeaks),
          message:
            strongest === null
              ? "No signal above the noise floor. Try again closer to the input."
              : `Heard the strongest signal on stream channel ${strongest}. Confirm to save as a learned mapping.`,
        },
      });
      this.learnTimer = null;
    }, 2500);
  }

  confirmLearnInput(): void {
    const { roleLabel, strongestChannel } = this.snapshot.learn;
    if (roleLabel === null || strongestChannel === null) return;
    const entries = this.snapshot.channelMap.entries.map((entry) =>
      entry.label === roleLabel
        ? {
            ...entry,
            streamChannel: strongestChannel,
            source: "learned" as const,
          }
        : { ...entry },
    );
    this.persistAndApply(entries);
    this.patch({
      learn: {
        phase: "idle",
        roleLabel: null,
        strongestChannel: null,
        peaks: [],
        message: `Saved learned mapping for "${roleLabel}" → stream channel ${strongestChannel}.`,
      },
    });
  }

  cancelLearn(): void {
    if (this.learnTimer) {
      clearTimeout(this.learnTimer);
      this.learnTimer = null;
    }
    this.patch({ learn: idleLearn() });
  }

  clearOverrides(): void {
    const key = this.deviceKey();
    if (key) this.overrides.clear(key);
    this.resolveProfileForSelection(this.engine.getExposedChannelCount() || null);
  }

  dispose(): void {
    this.cancelLearn();
    this.click.dispose();
    this.unbindDeviceChange?.();
    this.unbindDeviceChange = null;
    void this.engine.stop();
  }

  private ensurePeakScratch(count: number): void {
    if (this.peakScratch.length < count) {
      this.peakScratch = new Float32Array(count);
    }
  }

  private persistAndApply(entries: ChannelMapEntry[]): void {
    const key = this.deviceKey();
    if (key) this.overrides.set(key, entries);
    this.patch({
      channelMap: {
        ...this.snapshot.channelMap,
        entries,
      },
    });
  }

  private deviceKey(): string | null {
    const device = this.snapshot.devices.find((item) => item.deviceId === this.snapshot.inputDeviceId);
    if (!device) return null;
    return normalizeDeviceLabel(device.label) || device.deviceId;
  }

  private autoSelectDefaults(): void {
    const inputs = this.snapshot.devices.filter((device) => device.kind === "audioinput");
    const outputs = this.snapshot.devices.filter((device) => device.kind === "audiooutput");
    if (!this.snapshot.inputDeviceId && inputs[0]) {
      this.selectInput(inputs[0].deviceId);
    }
    if (!this.snapshot.outputDeviceId && outputs[0]) {
      this.selectOutput(outputs[0].deviceId);
    }
  }

  private resolveProfileForSelection(exposedChannelCount: number | null = null): void {
    const device = this.snapshot.devices.find((item) => item.deviceId === this.snapshot.inputDeviceId);
    const profile = device ? this.registry.resolve(device.label) : null;
    const base = this.mapper.build({ profile, exposedChannelCount });
    const overrides = this.deviceKey() ? this.overrides.get(this.deviceKey()!) : null;
    const entries = applyChannelMapOverrides(base.entries, overrides);
    this.patch({
      profile,
      channelMap: { ...base, entries },
    });
  }

  private patch(partial: Partial<AudioLabSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) listener();
  }
}

function emptyDiagnostics(): AudioDiagnostics {
  return {
    sampleRate: null,
    baseLatencySeconds: null,
    outputLatencySeconds: null,
    inputChannelCount: null,
  };
}

function idleLearn(): LearnInputState {
  return {
    phase: "idle",
    roleLabel: null,
    strongestChannel: null,
    peaks: [],
    message: null,
  };
}

function entriesToMeters(
  entries: readonly ChannelMapEntry[],
  channelCount: number,
  peaks: Float32Array,
): ChannelMeterReading[] {
  if (entries.length === 0) {
    return Array.from({ length: channelCount }, (_, streamChannel) => ({
      streamChannel,
      label: `Input ${streamChannel + 1}`,
      peak: peaks[streamChannel] ?? 0,
    }));
  }

  return entries.map((entry, index) => {
    const streamChannel = entry.streamChannel ?? index;
    return {
      streamChannel,
      label: entry.label,
      peak: streamChannel !== null && streamChannel < channelCount ? (peaks[streamChannel] ?? 0) : 0,
    };
  });
}

function toLabError(error: unknown): AudioLabError {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const coded = error as AudioLabError;
    return { code: coded.code, message: String(coded.message) };
  }
  return {
    code: "unknown",
    message: error instanceof Error ? error.message : "Audio Lab failed.",
  };
}
