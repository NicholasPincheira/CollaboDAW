import type { ProjectDocument } from "./project-document.ts";

export interface ProjectRepository {
  load(id: string): Promise<ProjectDocument | null>;
  save(project: ProjectDocument): Promise<void>;
}
