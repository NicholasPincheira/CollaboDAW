import { createEmptyProject, projectBpm } from "../../domain/project/create-empty-project.ts";
import type { ProjectDocument } from "../../domain/project/project-document.ts";
import { hashAccessCode } from "../../domain/session/access-code.ts";
import type {
  CreateWorkSessionInput,
  SessionCatalog,
  WorkSession,
  WorkSessionSummary,
} from "../../domain/session/session-catalog.ts";

const STORAGE_KEY = "minidaw.work-sessions.v1";

interface StoredWorkSession extends WorkSession {
  accessCodeHash: string;
}

export class LocalSessionCatalog implements SessionCatalog {
  private readonly storage: Storage | null;

  constructor(storage: Storage | null = defaultStorage()) {
    this.storage = storage;
  }

  async listRecent(limit = 12): Promise<WorkSessionSummary[]> {
    const sessions = this.readAll()
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return sessions.slice(0, limit);
  }

  async create(input: CreateWorkSessionInput): Promise<WorkSession> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const name = input.name.trim() || "Untitled session";
    const accessCodeHash = await hashAccessCode(input.accessCode);
    const session: StoredWorkSession = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      accessCodeHash,
      project: createEmptyProject({
        id,
        name,
        bpm: input.bpm,
        sampleRate: input.sampleRate,
      }),
    };
    const all = this.readAll();
    all.unshift(session);
    this.writeAll(all);
    return stripSecret(session);
  }

  async openWithCode(id: string, accessCode: string): Promise<WorkSession | null> {
    const hash = await hashAccessCode(accessCode);
    const found = this.readAll().find((session) => session.id === id && session.accessCodeHash === hash);
    return found ? stripSecret(found) : null;
  }

  async get(id: string): Promise<WorkSession | null> {
    const found = this.readAll().find((session) => session.id === id);
    return found ? stripSecret(found) : null;
  }

  async save(session: WorkSession): Promise<WorkSession> {
    const now = new Date().toISOString();
    const all = this.readAll();
    const existing = all.find((item) => item.id === session.id);
    if (!existing) throw new Error("Session not found.");
    const next: StoredWorkSession = {
      ...structuredClone(session),
      name: session.project.name,
      updatedAt: now,
      accessCodeHash: existing.accessCodeHash,
    };
    this.writeAll([next, ...all.filter((item) => item.id !== session.id)]);
    return stripSecret(next);
  }

  async remove(id: string): Promise<void> {
    this.writeAll(this.readAll().filter((session) => session.id !== id));
  }

  private readAll(): StoredWorkSession[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isStoredWorkSession);
    } catch {
      return [];
    }
  }

  private writeAll(sessions: StoredWorkSession[]): void {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function toSummary(session: WorkSession): WorkSessionSummary {
  return {
    id: session.id,
    name: session.name,
    bpm: projectBpm(session.project),
    updatedAt: session.updatedAt,
    createdAt: session.createdAt,
  };
}

function stripSecret(session: StoredWorkSession): WorkSession {
  return {
    id: session.id,
    name: session.name,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    project: structuredClone(session.project),
  };
}

function isStoredWorkSession(value: unknown): value is StoredWorkSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.accessCodeHash === "string" &&
    Boolean(record.project) &&
    typeof record.project === "object"
  );
}

export function assertProjectDocument(value: unknown): ProjectDocument | null {
  if (!value || typeof value !== "object") return null;
  const record = value as ProjectDocument;
  if (record.version !== 1 || typeof record.id !== "string" || typeof record.name !== "string") {
    return null;
  }
  return record;
}
