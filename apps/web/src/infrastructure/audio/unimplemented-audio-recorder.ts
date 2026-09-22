import type {
  AudioRecorder,
  AudioRecorderCapability,
  AudioRecorderPhase,
} from "../../domain/audio/audio-recorder.ts";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";

export class UnimplementedAudioRecorder implements AudioRecorder {
  readonly capability: AudioRecorderCapability = "unavailable";

  getPhase(): AudioRecorderPhase {
    return "idle";
  }

  start(_stream: MediaStream): Promise<void> {
    return Promise.reject(
      new UnimplementedCapabilityError("AudioRecorder", "Recording is not implemented in this slice."),
    );
  }

  stop(): Promise<Blob> {
    return Promise.reject(
      new UnimplementedCapabilityError("AudioRecorder", "Recording is not implemented in this slice."),
    );
  }
}
