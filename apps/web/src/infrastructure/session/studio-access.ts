/** Host unlock must come from build env — no public default in the client bundle. */
export const DEFAULT_STUDIO_ACCESS_KEY = "";

const STUDIO_UNLOCK_STORAGE = "minidaw.studio-unlocked";
const ROOM_UNLOCK_PREFIX = "minidaw.room-unlocked.";
const DISPLAY_NAME_KEY = "minidaw.display-name";

export function readConfiguredStudioAccessKey(
  env: ImportMetaEnv | Record<string, string | undefined> = import.meta.env,
): string {
  return env.VITE_STUDIO_ACCESS_KEY?.trim() ?? "";
}

export function isHostCreateEnabled(
  env: ImportMetaEnv | Record<string, string | undefined> = import.meta.env,
): boolean {
  return readConfiguredStudioAccessKey(env).length >= 8;
}

export function isStudioUnlocked(storage: Storage | null = safeSessionStorage()): boolean {
  return storage?.getItem(STUDIO_UNLOCK_STORAGE) === "1";
}

export function unlockStudio(
  candidate: string,
  env: ImportMetaEnv | Record<string, string | undefined> = import.meta.env,
  storage: Storage | null = safeSessionStorage(),
): boolean {
  const expected = readConfiguredStudioAccessKey(env);
  if (!expected || expected.length < 8) return false;
  const ok = candidate.trim() === expected;
  if (ok) storage?.setItem(STUDIO_UNLOCK_STORAGE, "1");
  return ok;
}

export function lockStudio(storage: Storage | null = safeSessionStorage()): void {
  storage?.removeItem(STUDIO_UNLOCK_STORAGE);
}

export function isRoomUnlocked(
  sessionId: string,
  storage: Storage | null = safeSessionStorage(),
): boolean {
  return storage?.getItem(`${ROOM_UNLOCK_PREFIX}${sessionId}`) === "1";
}

export function markRoomUnlocked(
  sessionId: string,
  storage: Storage | null = safeSessionStorage(),
): void {
  storage?.setItem(`${ROOM_UNLOCK_PREFIX}${sessionId}`, "1");
}

export function clearRoomUnlock(
  sessionId: string,
  storage: Storage | null = safeSessionStorage(),
): void {
  storage?.removeItem(`${ROOM_UNLOCK_PREFIX}${sessionId}`);
}

export function readDisplayName(storage: Storage | null = safeLocalStorage()): string {
  const raw = storage?.getItem(DISPLAY_NAME_KEY)?.trim();
  return raw && raw.length > 0 ? raw : "Guest";
}

export function writeDisplayName(
  name: string,
  storage: Storage | null = safeLocalStorage(),
): string {
  const next = name.trim() || "Guest";
  storage?.setItem(DISPLAY_NAME_KEY, next);
  return next;
}

export function createPresenceParticipantId(): string {
  try {
    const existing = safeLocalStorage()?.getItem("minidaw.presence-id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    safeLocalStorage()?.setItem("minidaw.presence-id", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function safeSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
