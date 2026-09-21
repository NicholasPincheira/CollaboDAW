export type AudioDeviceKind = "audioinput" | "audiooutput";

export interface AudioDeviceDescriptor {
  deviceId: string;
  kind: AudioDeviceKind;
  label: string;
}

export interface AudioDeviceSelection {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
}

export interface AudioDeviceManager {
  enumerate(): Promise<AudioDeviceDescriptor[]>;
  getSelection(): AudioDeviceSelection;
  selectInput(deviceId: string): void;
  selectOutput(deviceId: string): void;
}
