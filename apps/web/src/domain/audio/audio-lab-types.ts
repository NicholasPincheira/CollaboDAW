export type AudioLabStatus =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "starting"
  | "running"
  | "stopping"
  | "error";

export type LearnInputPhase = "idle" | "listening" | "awaiting-confirm";

export interface LearnInputState {
  phase: LearnInputPhase;
  roleLabel: string | null;
  strongestChannel: number | null;
  peaks: number[];
  message: string | null;
}

export interface ChannelMeterReading {
  streamChannel: number;
  label: string;
  peak: number;
}

export interface AudioLabError {
  code:
    | "unsupported"
    | "permission-denied"
    | "device-not-found"
    | "device-busy"
    | "invalid-device"
    | "stream-ended"
    | "context-suspended"
    | "unknown";
  message: string;
}
