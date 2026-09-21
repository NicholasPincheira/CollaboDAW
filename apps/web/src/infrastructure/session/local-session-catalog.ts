import { createEmptyProject, projectBpm } from "../../domain/project/create-empty-project.ts";
import type { ProjectDocument } from "../../domain/project/project-document.ts";
import type {
  CreateWorkSessionInput,
  SessionCatalog,
  WorkSession,
  WorkSessionSummary,
} from "../../domain/session/session-catalog.ts";

const STORAGE_KEY = "minidaw.work-sessions.v1";

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
    const session: WorkSession = {
      id,
      name: input.name.trim() || "Untitled session",
      createdAt: now,
      updatedAt: now,
      project: createEmptyProject({
        id,
        name: input.name.trim() || "Untitled session",
        bpm: input.bpm,
        sampleRate: input.sampleRate,
      }),
    };
    const all = this.readAll();
    all.unshift(session);
    this.writeAll(all);
    return structuredClone(session);
  }

  async get(id: string): Promise<WorkSession | null> {
    const found = this.readAll().find((session) => session.id === id);
    return found ? structuredClone(found) : null;
  }

  async save(session: WorkSession): Promise<WorkSession> {
    const now = new Date().toISOString();
    const next: WorkSession = {
      ...structuredClone(session),
      name: session.project.name,
      updatedAt: now,
    };
    const all = this.readAll().filter((item) => item.id !== session.id);
    all.unshift(next);
    this.writeAll(all);
    return structuredClone(next);
  }

  async remove(id: string): Promise<void> {
    this.writeAll(this.readAll().filter((session) => session.id !== id));
  }

  private readAll(): WorkSession[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isWorkSession);
    } catch {
      return [];
    }
  }

  private writeAll(sessions: WorkSession[]): void {
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

function isWorkSession(value: unknown): value is WorkSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.createdAt === "string" &&
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
