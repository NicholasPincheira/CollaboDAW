import type { ProjectDocument } from "../project/project-document.ts";

export interface WorkSessionSummary {
  id: string;
  name: string;
  bpm: number;
  updatedAt: string;
  createdAt: string;
}

export interface WorkSession {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  project: ProjectDocument;
}

export interface CreateWorkSessionInput {
  name: string;
  bpm?: number;
  sampleRate?: number;
}

export interface SessionCatalog {
  listRecent(limit?: number): Promise<WorkSessionSummary[]>;
  create(input: CreateWorkSessionInput): Promise<WorkSession>;
  get(id: string): Promise<WorkSession | null>;
  save(session: WorkSession): Promise<WorkSession>;
  remove(id: string): Promise<void>;
}
