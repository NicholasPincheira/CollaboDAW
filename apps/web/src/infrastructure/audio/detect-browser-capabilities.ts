export interface BrowserAudioCapabilities {
  mediaDevices: boolean;
  enumerateDevices: boolean;
  getUserMedia: boolean;
  audioContext: boolean;
  setSinkId: boolean;
  outputLatency: boolean;
}

export function detectBrowserAudioCapabilities(
  globalObject: Window & typeof globalThis = window,
): BrowserAudioCapabilities {
  const mediaDevices = globalObject.navigator?.mediaDevices;
  const AudioContextCtor =
    globalObject.AudioContext ??
    (globalObject as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  let setSinkId = false;
  if (typeof AudioContextCtor === "function") {
    setSinkId =
      typeof (AudioContextCtor.prototype as AudioContext & { setSinkId?: unknown }).setSinkId ===
      "function";
  }

  let outputLatency = false;
  if (typeof AudioContextCtor === "function") {
    outputLatency = "outputLatency" in AudioContextCtor.prototype;
  }

  return {
    mediaDevices: Boolean(mediaDevices),
    enumerateDevices: typeof mediaDevices?.enumerateDevices === "function",
    getUserMedia: typeof mediaDevices?.getUserMedia === "function",
    audioContext: typeof AudioContextCtor === "function",
    setSinkId,
    outputLatency,
  };
}
