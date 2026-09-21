import type { AssetStorage } from "../../domain/project/asset-storage.ts";

export class MemoryAssetStorage implements AssetStorage {
  private readonly assets = new Map<string, Blob>();

  async put(id: string, data: Blob): Promise<void> {
    this.assets.set(id, data);
  }

  async get(id: string): Promise<Blob | null> {
    return this.assets.get(id) ?? null;
  }
}
