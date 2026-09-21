/** SHA-256 hex digest for room access codes (browser Web Crypto). */
export async function hashAccessCode(code: string): Promise<string> {
  const normalized = code.trim();
  if (normalized.length < 4) {
    throw new Error("Access code must be at least 4 characters.");
  }
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeAccessCode(code: string): string {
  return code.trim();
}
