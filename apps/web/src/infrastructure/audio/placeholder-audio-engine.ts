import type { AudioDiagnostics, AudioEngine, AudioEngineState } from "../../domain/audio/audio-engine.ts";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";

const EMPTY_DIAGNOSTICS: AudioDiagnostics = {
  sampleRate: null,
  baseLatencySeconds: null,
  outputLatencySeconds: null,
  inputChannelCount: null,
};

export class PlaceholderAudioEngine implements AudioEngine {
  readonly state: AudioEngineState = "idle";

  start(): Promise<void> {
    return Promise.reject(
      new UnimplementedCapabilityError(
        "AudioEngine",
        "The Web Audio graph is not started in the bootstrap slice.",
      ),
    );
  }

  stop(): Promise<void> {
    return Promise.reject(
      new UnimplementedCapabilityError(
        "AudioEngine",
        "The Web Audio graph is not started in the bootstrap slice.",
      ),
    );
  }

  getDiagnostics(): AudioDiagnostics {
    return { ...EMPTY_DIAGNOSTICS };
  }
}
