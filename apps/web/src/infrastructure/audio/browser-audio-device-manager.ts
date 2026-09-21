import type {
  AudioDeviceDescriptor,
  AudioDeviceKind,
  AudioDeviceManager,
  AudioDeviceSelection,
} from "../../domain/audio/audio-device-manager.ts";
import type { AudioLabError } from "../../domain/audio/audio-lab-types.ts";

export class BrowserAudioDeviceManager implements AudioDeviceManager {
  private selection: AudioDeviceSelection = {
    inputDeviceId: null,
    outputDeviceId: null,
  };

  private permissionStream: MediaStream | null = null;

  async enumerate(): Promise<AudioDeviceDescriptor[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === "audioinput" || device.kind === "audiooutput")
      .map((device) => ({
        deviceId: device.deviceId,
        kind: device.kind as AudioDeviceKind,
        label: device.label || unlabeled(device.kind as AudioDeviceKind, device.deviceId),
      }));
  }

  getSelection(): AudioDeviceSelection {
    return { ...this.selection };
  }

  selectInput(deviceId: string): void {
    this.selection = { ...this.selection, inputDeviceId: deviceId };
  }

  selectOutput(deviceId: string): void {
    this.selection = { ...this.selection, outputDeviceId: deviceId };
  }

  onDeviceChange(listener: () => void): () => void {
    if (!navigator.mediaDevices?.addEventListener) {
      return () => undefined;
    }
    const handler = (): void => {
      listener();
    };
    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handler);
    };
  }

  async requestPermission(): Promise<"granted" | "denied" | "unsupported"> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return "unsupported";
    }
    try {
      this.releasePermissionProbe();
      this.permissionStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      this.releasePermissionProbe();
      return "granted";
    } catch (error) {
      this.releasePermissionProbe();
      if (isPermissionDenied(error)) return "denied";
      throw error;
    }
  }

  async openInputStream(deviceId: string, channelCountIdeal = 2): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw labError("unsupported", "This browser cannot open an audio input stream.");
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          channelCount: { ideal: channelCountIdeal },
          sampleRate: { ideal: 48000 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (error) {
      throw mapGetUserMediaError(error);
    }
  }

  private releasePermissionProbe(): void {
    this.permissionStream?.getTracks().forEach((track) => track.stop());
    this.permissionStream = null;
  }
}

function unlabeled(kind: AudioDeviceKind, deviceId: string): string {
  const short = deviceId.slice(0, 8) || "unknown";
  return kind === "audioinput" ? `Input (${short})` : `Output (${short})`;
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
}

function mapGetUserMediaError(error: unknown): AudioLabError & Error {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return labError("permission-denied", "Microphone permission was denied.");
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return labError("device-not-found", "The selected input device is unavailable.");
    }
    if (error.name === "NotReadableError" || error.name === "AbortError") {
      return labError("device-busy", "The selected input device is busy or unreadable.");
    }
    if (error.name === "InvalidStateError" || error.name === "TypeError") {
      return labError("invalid-device", "The selected device id is invalid.");
    }
  }
  return labError("unknown", error instanceof Error ? error.message : "Could not open the input stream.");
}

function labError(code: AudioLabError["code"], message: string): AudioLabError & Error {
  const err = new Error(message) as Error & AudioLabError;
  err.code = code;
  err.message = message;
  return err;
}
