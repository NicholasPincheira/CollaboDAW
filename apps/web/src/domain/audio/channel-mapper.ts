import type { AudioHardwareProfile, AudioInputType } from "./hardware-profile.ts";

export type ChannelMapSource = "profile-default" | "generic" | "manual" | "learned";

export type ChannelMapMode =
  | "known-profile"
  | "generic-multichannel"
  | "limited-capture"
  | "unmeasured";

export interface ChannelMapEntry {
  streamChannel: number | null;
  label: string;
  type: AudioInputType;
  source: ChannelMapSource;
}

export interface ChannelMap {
  mode: ChannelMapMode;
  requiresRuntimeValidation: boolean;
  entries: ChannelMapEntry[];
}

export interface ChannelMapRequest {
  profile: AudioHardwareProfile | null;
  exposedChannelCount: number | null;
}

export interface ChannelMapper {
  build(input: ChannelMapRequest): ChannelMap;
}
