/**
 * Local metronome scheduled on AudioContext.currentTime.
 * A short look-ahead timer only queues Web Audio events; it is not the musical clock.
 */
export class LocalClickScheduler {
  private readonly getContext: () => AudioContext | null;
  private readonly getDestination: () => AudioNode | null;
  private playing = false;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private bpm = 120;
  private beatsPerBar = 4;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly lookAheadMs = 25;
  private readonly scheduleAhead = 0.12;

  constructor(
    getContext: () => AudioContext | null,
    getDestination: () => AudioNode | null = () => null,
  ) {
    this.getContext = getContext;
    this.getDestination = getDestination;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getBeatIndex(): number {
    return this.beatIndex;
  }

  setTempo(bpm: number, beatsPerBar: number): void {
    this.bpm = Math.min(300, Math.max(30, bpm));
    this.beatsPerBar = Math.min(16, Math.max(1, Math.round(beatsPerBar)));
  }

  start(bpm: number, beatsPerBar: number): void {
    const context = this.getContext();
    if (!context) {
      throw new Error("Start audio before playing the click.");
    }
    this.setTempo(bpm, beatsPerBar);
    this.playing = true;
    this.beatIndex = 0;
    this.nextBeatTime = context.currentTime + 0.05;
    this.armTimer();
    this.scheduler();
  }

  stop(): void {
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.stop();
  }

  private armTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.scheduler(), this.lookAheadMs);
  }

  private scheduler(): void {
    const context = this.getContext();
    if (!this.playing || !context) return;
    while (this.nextBeatTime < context.currentTime + this.scheduleAhead) {
      this.scheduleClick(context, this.nextBeatTime, this.beatIndex % this.beatsPerBar === 0);
      this.nextBeatTime += 60 / this.bpm;
      this.beatIndex += 1;
    }
  }

  private scheduleClick(context: AudioContext, when: number, accent: boolean): void {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "square";
    osc.frequency.value = accent ? 1200 : 800;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.22 : 0.12, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    osc.connect(gain);
    const dest = this.getDestination() ?? context.destination;
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + 0.06);
  }
}
