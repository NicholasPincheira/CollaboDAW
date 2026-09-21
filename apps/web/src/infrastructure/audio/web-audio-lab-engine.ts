import type { AudioDiagnostics, AudioEngine, AudioEngineState } from "../../domain/audio/audio-engine.ts";
import { measurePeak } from "../../domain/audio/signal-analysis.ts";

type SinkResult = "applied" | "unsupported" | "failed";

interface ChannelNode {
  analyser: AnalyserNode;
  monitorGain: GainNode;
  timeDomain: Float32Array;
}

/**
 * Local Audio Lab graph:
 * MediaStreamSource -> ChannelSplitter -> [Analyser + monitor Gain] -> Destination
 */
export class WebAudioLabEngine implements AudioEngine {
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private stream: MediaStream | null = null;
  private channels: ChannelNode[] = [];
  private monitoring = false;
  private exposedChannelCount = 0;
  private endedHandler: (() => void) | null = null;

  get state(): AudioEngineState {
    if (!this.context) return "idle";
    if (this.context.state === "closed") return "closed";
    if (this.context.state === "suspended") return "suspended";
    return this.source ? "running" : "idle";
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
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
  }

  async attachInput(stream: MediaStream): Promise<void> {
    this.detachGraph();
    this.stopStreamTracks();

    const context = this.ensureContext();
    if (context.state === "suspended") {
      await context.resume();
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
      monitorGain.connect(context.destination);
      this.channels.push({ analyser, monitorGain, timeDomain });
    }

    this.applyMonitoring();
  }

  setMonitoring(enabled: boolean): void {
    this.monitoring = enabled;
    this.applyMonitoring();
  }

  getMonitoring(): boolean {
    return this.monitoring;
  }

  getExposedChannelCount(): number {
    return this.exposedChannelCount;
  }

  /** Fills `out` with peak levels for each exposed stream channel. */
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
    const context = this.ensureContext() as AudioContext & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };
    if (typeof context.setSinkId !== "function") {
      return "unsupported";
    }
    try {
      await context.setSinkId(deviceId);
      return "applied";
    } catch {
      return "failed";
    }
  }

  private ensureContext(): AudioContext {
    if (this.context && this.context.state !== "closed") {
      return this.context;
    }
    this.context = new AudioContext({ latencyHint: "interactive" });
    return this.context;
  }

  private applyMonitoring(): void {
    const value = this.monitoring ? 1 : 0;
    for (const channel of this.channels) {
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

  private stopStreamTracks(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
