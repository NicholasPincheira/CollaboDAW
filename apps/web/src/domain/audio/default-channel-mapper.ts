import type { ChannelMap, ChannelMapRequest, ChannelMapper } from "./channel-mapper.ts";

export function buildChannelMap(input: ChannelMapRequest): ChannelMap {
  const { profile, exposedChannelCount } = input;

  if (exposedChannelCount === null) {
    if (!profile) {
      return {
        mode: "unmeasured",
        requiresRuntimeValidation: true,
        entries: [],
      };
    }
    return {
      mode: "unmeasured",
      requiresRuntimeValidation: true,
      entries: profile.defaultInputs.map((entry) => ({
        streamChannel: entry.channelIndex,
        label: entry.label,
        type: entry.type,
        source: "profile-default" as const,
      })),
    };
  }

  if (!profile) {
    return {
      mode: exposedChannelCount > 0 ? "generic-multichannel" : "limited-capture",
      requiresRuntimeValidation: true,
      entries: Array.from({ length: exposedChannelCount }, (_, index) => ({
        streamChannel: index,
        label: `Input ${index + 1}`,
        type: "unknown" as const,
        source: "generic" as const,
      })),
    };
  }

  if (profile.channelOrder === "runtime") {
    return {
      mode: "known-profile",
      requiresRuntimeValidation: true,
      entries: profile.defaultInputs.map((entry) => ({
        streamChannel: null,
        label: entry.label,
        type: entry.type,
        source: "profile-default" as const,
      })),
    };
  }

  const entries = profile.defaultInputs.flatMap((entry) => {
    if (entry.channelIndex === null || entry.channelIndex >= exposedChannelCount) {
      return [];
    }
    return [
      {
        streamChannel: entry.channelIndex,
        label: entry.label,
        type: entry.type,
        source: "profile-default" as const,
      },
    ];
  });

  const expected = profile.defaultInputs.length;
  return {
    mode: exposedChannelCount < expected ? "limited-capture" : "known-profile",
    requiresRuntimeValidation: true,
    entries,
  };
}

export class DefaultChannelMapper implements ChannelMapper {
  build(input: ChannelMapRequest): ChannelMap {
    return buildChannelMap(input);
  }
}
