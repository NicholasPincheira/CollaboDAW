export interface AssetStorage {
  put(id: string, data: Blob): Promise<void>;
  get(id: string): Promise<Blob | null>;
}
