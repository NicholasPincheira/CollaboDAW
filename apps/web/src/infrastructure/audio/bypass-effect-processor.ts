import type { EffectProcessor } from "../../domain/audio/effect-processor.ts";

export class BypassEffectProcessor implements EffectProcessor {
  readonly id: string;
  readonly kind: string;
  private bypass: boolean;

  constructor(id: string, kind: string) {
    this.id = id;
    this.kind = kind;
    this.bypass = true;
  }

  getBypass(): boolean {
    return this.bypass;
  }

  setBypass(bypass: boolean): void {
    this.bypass = bypass;
  }
}
