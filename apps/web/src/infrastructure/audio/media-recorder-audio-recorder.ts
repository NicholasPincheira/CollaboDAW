import type {
  AudioRecorder,
  AudioRecorderCapability,
  AudioRecorderPhase,
} from "../../domain/audio/audio-recorder.ts";

/** Pick a mime type Chromium accepts for MediaRecorder. */
export function pickMediaRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Stage-1 dry recorder: MediaStream (pre-monitor tap) → MediaRecorder → Blob.
 */
export class MediaRecorderAudioRecorder implements AudioRecorder {
  readonly capability: AudioRecorderCapability = "media-recorder";

  private phase: AudioRecorderPhase = "idle";
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private stopResolver: ((blob: Blob) => void) | null = null;
  private stopRejecter: ((error: Error) => void) | null = null;

  getPhase(): AudioRecorderPhase {
    return this.phase;
  }

  async start(stream: MediaStream): Promise<void> {
    if (this.phase === "recording") {
      throw new Error("Already recording.");
    }
    if (typeof MediaRecorder === "undefined") {
      throw new Error("MediaRecorder is not supported in this browser.");
    }
    if (stream.getAudioTracks().length === 0) {
      throw new Error("Dry record tap has no audio tracks.");
    }

    const mimeType = pickMediaRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    this.chunks = [];
    this.recorder = recorder;
    this.phase = "recording";

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      const error = new Error("MediaRecorder failed.");
      this.phase = "idle";
      this.recorder = null;
      this.stopRejecter?.(error);
      this.stopResolver = null;
      this.stopRejecter = null;
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(this.chunks, { type });
      this.chunks = [];
      this.recorder = null;
      this.phase = "idle";
      this.stopResolver?.(blob);
      this.stopResolver = null;
      this.stopRejecter = null;
    };

    recorder.start(250);
  }

  stop(): Promise<Blob> {
    if (this.phase !== "recording" || !this.recorder) {
      return Promise.reject(new Error("Not recording."));
    }
    if (this.recorder.state === "inactive") {
      this.phase = "idle";
      this.recorder = null;
      return Promise.reject(new Error("MediaRecorder became inactive."));
    }

    return new Promise<Blob>((resolve, reject) => {
      this.stopResolver = resolve;
      this.stopRejecter = reject;
      try {
        this.recorder?.stop();
      } catch (error) {
        this.phase = "idle";
        this.recorder = null;
        this.stopResolver = null;
        this.stopRejecter = null;
        reject(error instanceof Error ? error : new Error("Could not stop MediaRecorder."));
      }
    });
  }
}
