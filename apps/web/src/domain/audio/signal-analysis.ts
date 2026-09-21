/** Peak of absolute samples in a time-domain buffer. Pure and allocation-free for the caller buffer. */
export function measurePeak(samples: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.abs(samples[i] ?? 0);
    if (value > peak) peak = value;
  }
  return peak;
}

/**
 * Pick the stream channel with the strongest observed peak.
 * Returns null when every channel stays below the noise floor.
 */
export function pickStrongestChannel(
  peaks: readonly number[],
  noiseFloor = 0.02,
): number | null {
  let bestIndex: number | null = null;
  let bestPeak = noiseFloor;
  for (let i = 0; i < peaks.length; i += 1) {
    const peak = peaks[i] ?? 0;
    if (peak > bestPeak) {
      bestPeak = peak;
      bestIndex = i;
    }
  }
  return bestIndex;
}
