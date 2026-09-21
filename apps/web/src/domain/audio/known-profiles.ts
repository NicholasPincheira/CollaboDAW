import type { AudioHardwareProfile } from "./hardware-profile.ts";

const RUNTIME_NOTE =
  "Profile mapping is advisory. Browser channel order must be validated after getUserMedia().";

export const KNOWN_AUDIO_PROFILES: readonly AudioHardwareProfile[] = [
  {
    id: "focusrite-itrack-solo",
    manufacturer: "Focusrite",
    model: "iTrack Solo",
    matchers: [{ includes: ["itrack", "solo"] }],
    channelOrder: "advisory",
    defaultInputs: [
      { channelIndex: 0, label: "Microphone", type: "microphone", preferredFor: "vocal" },
      { channelIndex: 1, label: "Guitar / Instrument", type: "instrument", preferredFor: "guitar" },
    ],
    defaultOutputs: [
      { channelIndex: 0, label: "Output 1" },
      { channelIndex: 1, label: "Output 2" },
    ],
    notes: [RUNTIME_NOTE],
  },
  {
    id: "focusrite-scarlett-solo-4th",
    manufacturer: "Focusrite",
    model: "Scarlett Solo 4th Gen",
    matchers: [
      { includes: ["scarlett", "solo", "4th"] },
      { includes: ["scarlett", "solo", "fourth"] },
    ],
    channelOrder: "runtime",
    defaultInputs: [
      { channelIndex: null, label: "Microphone", type: "microphone", preferredFor: "vocal" },
      {
        channelIndex: null,
        label: "Instrument / Line",
        type: "instrument",
        preferredFor: "guitar",
      },
    ],
    defaultOutputs: [
      { channelIndex: null, label: "Output 1" },
      { channelIndex: null, label: "Output 2" },
    ],
    notes: [
      "Do not reuse the 3rd Gen channel indexes.",
      RUNTIME_NOTE,
    ],
  },
  {
    id: "focusrite-scarlett-solo-3rd",
    manufacturer: "Focusrite",
    model: "Scarlett Solo 3rd Gen",
    matchers: [
      { includes: ["scarlett", "solo", "3rd"] },
      { includes: ["scarlett", "solo", "third"] },
    ],
    channelOrder: "advisory",
    defaultInputs: [
      { channelIndex: 0, label: "Microphone", type: "microphone", preferredFor: "vocal" },
      { channelIndex: 1, label: "Guitar / Instrument", type: "instrument", preferredFor: "guitar" },
    ],
    defaultOutputs: [
      { channelIndex: 0, label: "Output 1" },
      { channelIndex: 1, label: "Output 2" },
    ],
    notes: [RUNTIME_NOTE],
  },
  {
    id: "behringer-umc22",
    manufacturer: "Behringer",
    model: "U-Phoria UMC22",
    matchers: [{ includes: ["umc22"] }, { includes: ["umc", "22"] }],
    channelOrder: "advisory",
    defaultInputs: [
      { channelIndex: 0, label: "Mic / Line", type: "microphone", preferredFor: "vocal" },
      { channelIndex: 1, label: "Instrument", type: "instrument", preferredFor: "guitar" },
    ],
    defaultOutputs: [
      { channelIndex: 0, label: "Output 1" },
      { channelIndex: 1, label: "Output 2" },
    ],
    notes: ["Documented as 2x2 at 48 kHz with direct monitoring.", RUNTIME_NOTE],
  },
];

export function normalizeDeviceLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
