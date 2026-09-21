export interface EffectProcessor {
  readonly id: string;
  readonly kind: string;
  getBypass(): boolean;
  setBypass(bypass: boolean): void;
}
