export class UnimplementedCapabilityError extends Error {
  readonly capability: string;

  constructor(capability: string, message: string) {
    super(message);
    this.name = "UnimplementedCapabilityError";
    this.capability = capability;
  }
}
