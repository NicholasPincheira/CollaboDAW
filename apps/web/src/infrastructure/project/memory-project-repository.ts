import type { ProjectDocument } from "../../domain/project/project-document.ts";
import type { ProjectRepository } from "../../domain/project/project-repository.ts";

export class MemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, ProjectDocument>();

  async load(id: string): Promise<ProjectDocument | null> {
    const project = this.projects.get(id);
    return project ? structuredClone(project) : null;
  }

  async save(project: ProjectDocument): Promise<void> {
    this.projects.set(project.id, structuredClone(project));
  }
}
