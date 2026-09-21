import type {
  AudioDeviceDescriptor,
  AudioDeviceManager,
  AudioDeviceSelection,
} from "../../domain/audio/audio-device-manager.ts";

export class PlaceholderAudioDeviceManager implements AudioDeviceManager {
  private selection: AudioDeviceSelection = {
    inputDeviceId: null,
    outputDeviceId: null,
  };

  enumerate(): Promise<AudioDeviceDescriptor[]> {
    return Promise.resolve([]);
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
}
