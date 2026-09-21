import type { AudioDiagnostics, AudioEngine, AudioEngineState } from "../../domain/audio/audio-engine.ts";
import { measurePeak } from "../../domain/audio/signal-analysis.ts";

export type LatencyMode = "live" | "record" | "rehearsal" | "mix";
export type SinkResult = "applied" | "unsupported" | "failed";

export interface ChannelMonitorState {
  muted: boolean;
  solo: boolean;
  gain: number;
}

interface ChannelNode {
  analyser: AnalyserNode;
  monitorGain: GainNode;
  timeDomain: Float32Array;
  muted: boolean;
  solo: boolean;
  userGain: number;
}

function latencyHintFor(mode: LatencyMode): AudioContextLatencyCategory {
  if (mode === "mix") return "playback";
  if (mode === "rehearsal") return "balanced";
  return "interactive";
}

/**
 * Local Audio Lab graph:
 * MediaStreamSource -> ChannelSplitter -> [Analyser + monitor Gain]
 *   -> masterGain -> destination (primary sink)
 *                └-> MediaStreamDestination -> <audio> (secondary sink)
 */
export class WebAudioLabEngine implements AudioEngine {
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private masterGain: GainNode | null = null;
  private secondaryDest: MediaStreamAudioDestinationNode | null = null;
  private secondaryAudio: HTMLAudioElement | null = null;
  private stream: MediaStream | null = null;
  private channels: ChannelNode[] = [];
  private monitoring = false;
  private exposedChannelCount = 0;
  private endedHandler: (() => void) | null = null;
  private latencyMode: LatencyMode = "live";
  private preferredSampleRate: number | null = 48000;
  private primarySinkId = "";
  private secondarySinkId = "";

  get state(): AudioEngineState {
    if (!this.context) return "idle";
    if (this.context.state === "closed") return "closed";
    if (this.context.state === "suspended") return "suspended";
    return this.source ? "running" : "idle";
  }

  getAudioContext(): AudioContext | null {
    return this.context && this.context.state !== "closed" ? this.context : null;
  }

  getMonitorTap(): AudioNode | null {
    return this.masterGain;
  }

  getLatencyMode(): LatencyMode {
    return this.latencyMode;
  }

  getPreferredSampleRate(): number | null {
    return this.preferredSampleRate;
  }

  /** Recreate context on next ensure/start when rate or latency mode changes. */
  async configurePerformance(options: {
    latencyMode?: LatencyMode;
    sampleRate?: number | null;
  }): Promise<boolean> {
    let dirty = false;
    if (options.latencyMode && options.latencyMode !== this.latencyMode) {
      this.latencyMode = options.latencyMode;
      dirty = true;
    }
    if (options.sampleRate !== undefined && options.sampleRate !== this.preferredSampleRate) {
      this.preferredSampleRate = options.sampleRate;
      dirty = true;
    }
    if (dirty && this.context && this.context.state !== "closed") {
      await this.context.close();
      this.context = null;
      this.masterGain = null;
    }
    return dirty;
  }

  async setLatencyMode(mode: LatencyMode): Promise<void> {
    await this.configurePerformance({ latencyMode: mode });
  }

  async start(): Promise<void> {
    const context = this.ensureContext();
    if (context.state === "suspended") {
      await context.resume();
    }
  }

  async stop(): Promise<void> {
    this.detachGraph();
    this.stopStreamTracks();
    this.teardownSecondary();
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
    this.masterGain = null;
  }

  async attachInput(stream: MediaStream): Promise<void> {
    this.detachGraph();
    this.stopStreamTracks();

    const context = this.ensureContext();
    if (context.state === "suspended") {
      await context.resume();
    }

    if (!this.masterGain || this.masterGain.context !== context) {
      this.masterGain = context.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(context.destination);
      await this.ensureSecondaryTap(context);
    }

    this.stream = stream;
    const track = stream.getAudioTracks()[0];
    if (!track) {
      throw new Error("Input stream has no audio track.");
    }

    this.endedHandler = () => {
      this.detachGraph();
    };
    track.addEventListener("ended", this.endedHandler);

    const settings = track.getSettings();
    const channelCount = Math.max(1, settings.channelCount ?? 1);
    this.exposedChannelCount = channelCount;

    this.source = context.createMediaStreamSource(stream);
    this.splitter = context.createChannelSplitter(channelCount);
    this.source.connect(this.splitter);

    this.channels = [];
    for (let index = 0; index < channelCount; index += 1) {
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      const monitorGain = context.createGain();
      monitorGain.gain.value = 0;
      const timeDomain = new Float32Array(analyser.fftSize);
      this.splitter.connect(analyser, index);
      this.splitter.connect(monitorGain, index);
      monitorGain.connect(this.masterGain!);
      this.channels.push({
        analyser,
        monitorGain,
        timeDomain,
        muted: false,
        solo: false,
        userGain: 1,
      });
    }

    this.applyMonitoring();
    if (this.primarySinkId) {
      await this.setSinkId(this.primarySinkId);
    }
    if (this.secondarySinkId) {
      await this.setSecondarySinkId(this.secondarySinkId);
    }
  }

  setMonitoring(enabled: boolean): void {
    this.monitoring = enabled;
    this.applyMonitoring();
  }

  getMonitoring(): boolean {
    return this.monitoring;
  }

  setChannelMonitor(index: number, state: Partial<ChannelMonitorState>): void {
    const channel = this.channels[index];
    if (!channel) return;
    if (typeof state.muted === "boolean") channel.muted = state.muted;
    if (typeof state.solo === "boolean") channel.solo = state.solo;
    if (typeof state.gain === "number") channel.userGain = clamp01(state.gain);
    this.applyMonitoring();
  }

  getChannelMonitors(): ChannelMonitorState[] {
    return this.channels.map((channel) => ({
      muted: channel.muted,
      solo: channel.solo,
      gain: channel.userGain,
    }));
  }

  getExposedChannelCount(): number {
    return this.exposedChannelCount;
  }

  readPeaks(out: Float32Array): void {
    const count = Math.min(out.length, this.channels.length);
    for (let i = 0; i < count; i += 1) {
      const channel = this.channels[i];
      if (!channel) {
        out[i] = 0;
        continue;
      }
      channel.analyser.getFloatTimeDomainData(
        channel.timeDomain as unknown as Float32Array<ArrayBuffer>,
      );
      out[i] = measurePeak(channel.timeDomain);
    }
    for (let i = count; i < out.length; i += 1) {
      out[i] = 0;
    }
  }

  getDiagnostics(): AudioDiagnostics {
    if (!this.context) {
      return {
        sampleRate: null,
        baseLatencySeconds: null,
        outputLatencySeconds: null,
        inputChannelCount: this.exposedChannelCount || null,
      };
    }
    const outputLatency =
      "outputLatency" in this.context && typeof this.context.outputLatency === "number"
        ? this.context.outputLatency
        : null;
    return {
      sampleRate: this.context.sampleRate,
      baseLatencySeconds: this.context.baseLatency,
      outputLatencySeconds: outputLatency,
      inputChannelCount: this.exposedChannelCount || null,
    };
  }

  async setSinkId(deviceId: string): Promise<SinkResult> {
    this.primarySinkId = deviceId;
    const context = this.ensureContext() as AudioContext & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };
    if (typeof context.setSinkId !== "function") {
      return "unsupported";
    }
    try {
      await context.setSinkId(deviceId || "");
      return "applied";
    } catch {
      return "failed";
    }
  }

  async setSecondarySinkId(deviceId: string): Promise<SinkResult> {
    this.secondarySinkId = deviceId;
    const context = this.ensureContext();
    await this.ensureSecondaryTap(context);

    if (!this.secondaryAudio) return "failed";
    if (!deviceId) {
      this.secondaryAudio.pause();
      this.secondaryAudio.srcObject = null;
      return "applied";
    }

    const element = this.secondaryAudio as HTMLAudioElement & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };
    if (typeof element.setSinkId !== "function") {
      return "unsupported";
    }
    try {
      if (this.secondaryDest) {
        element.srcObject = this.secondaryDest.stream;
      }
      await element.setSinkId(deviceId);
      await element.play().catch(() => undefined);
      return "applied";
    } catch {
      return "failed";
    }
  }

  private async ensureSecondaryTap(context: AudioContext): Promise<void> {
    if (!this.masterGain) return;
    if (!this.secondaryDest || this.secondaryDest.context !== context) {
      this.secondaryDest?.disconnect();
      this.secondaryDest = context.createMediaStreamDestination();
      this.masterGain.connect(this.secondaryDest);
    }
    if (!this.secondaryAudio) {
      this.secondaryAudio = new Audio();
      this.secondaryAudio.autoplay = true;
    }
  }

  private ensureContext(): AudioContext {
    if (this.context && this.context.state !== "closed") {
      return this.context;
    }
    const options: AudioContextOptions = {
      latencyHint: latencyHintFor(this.latencyMode),
    };
    if (this.preferredSampleRate) {
      options.sampleRate = this.preferredSampleRate;
    }
    this.context = new AudioContext(options);
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.context.destination);
    void this.ensureSecondaryTap(this.context);
    return this.context;
  }

  private applyMonitoring(): void {
    const anySolo = this.channels.some((channel) => channel.solo);
    for (const channel of this.channels) {
      let value = 0;
      if (this.monitoring) {
        const silenced = channel.muted || (anySolo && !channel.solo);
        value = silenced ? 0 : channel.userGain;
      }
      channel.monitorGain.gain.value = value;
    }
  }

  private detachGraph(): void {
    const track = this.stream?.getAudioTracks()[0];
    if (track && this.endedHandler) {
      track.removeEventListener("ended", this.endedHandler);
    }
    this.endedHandler = null;

    for (const channel of this.channels) {
      channel.analyser.disconnect();
      channel.monitorGain.disconnect();
    }
    this.channels = [];
    this.splitter?.disconnect();
    this.splitter = null;
    this.source?.disconnect();
    this.source = null;
    this.exposedChannelCount = 0;
  }

  private teardownSecondary(): void {
    if (this.secondaryAudio) {
      this.secondaryAudio.pause();
      this.secondaryAudio.srcObject = null;
      this.secondaryAudio = null;
    }
    this.secondaryDest?.disconnect();
    this.secondaryDest = null;
  }

  private stopStreamTracks(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
