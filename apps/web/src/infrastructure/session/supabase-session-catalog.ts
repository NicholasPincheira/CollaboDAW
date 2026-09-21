import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptyProject, projectBpm } from "../../domain/project/create-empty-project.ts";
import type { ProjectDocument } from "../../domain/project/project-document.ts";
import type {
  CreateWorkSessionInput,
  SessionCatalog,
  WorkSession,
  WorkSessionSummary,
} from "../../domain/session/session-catalog.ts";
import { assertProjectDocument } from "./local-session-catalog.ts";

interface WorkSessionRow {
  id: string;
  name: string;
  bpm: number;
  sample_rate: number;
  time_signature_num: number;
  time_signature_den: number;
  project_document: ProjectDocument | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class SupabaseSessionCatalog implements SessionCatalog {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }
  async listRecent(limit = 12): Promise<WorkSessionSummary[]> {
    const { data, error } = await this.client
      .from("work_sessions")
      .select("id,name,bpm,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      bpm: Number(row.bpm),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async create(input: CreateWorkSessionInput): Promise<WorkSession> {
    const id = crypto.randomUUID();
    const name = input.name.trim() || "Untitled session";
    const project = createEmptyProject({
      id,
      name,
      bpm: input.bpm,
      sampleRate: input.sampleRate,
    });
    const { data, error } = await this.client
      .from("work_sessions")
      .insert({
        id,
        name,
        bpm: projectBpm(project),
        sample_rate: project.sampleRate,
        time_signature_num: project.timeSignature.numerator,
        time_signature_den: project.timeSignature.denominator,
        project_document: project,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToSession(data as WorkSessionRow);
  }

  async get(id: string): Promise<WorkSession | null> {
    const { data, error } = await this.client.from("work_sessions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToSession(data as WorkSessionRow);
  }

  async save(session: WorkSession): Promise<WorkSession> {
    const project = session.project;
    const { data, error } = await this.client
      .from("work_sessions")
      .update({
        name: project.name,
        bpm: projectBpm(project),
        sample_rate: project.sampleRate,
        time_signature_num: project.timeSignature.numerator,
        time_signature_den: project.timeSignature.denominator,
        project_document: project,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToSession(data as WorkSessionRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("work_sessions").delete().eq("id", id);
    if (error) throw error;
  }
}

function rowToSession(row: WorkSessionRow): WorkSession {
  const project =
    assertProjectDocument(row.project_document) ??
    createEmptyProject({
      id: row.id,
      name: row.name,
      bpm: Number(row.bpm),
      sampleRate: row.sample_rate,
    });
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    project: {
      ...project,
      id: row.id,
      name: row.name,
      sampleRate: row.sample_rate,
      timeSignature: {
        numerator: row.time_signature_num,
        denominator: row.time_signature_den,
      },
    },
  };
}
