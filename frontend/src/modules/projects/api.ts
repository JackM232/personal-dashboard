import { api } from "../../api/client";
import type { MilestoneBody, Project, ProjectMilestone } from "./types";

export const projectsApi = {
  listProjects: () => api.get<Project[]>("/api/projects"),
  createProject: (body: Partial<Project>) => api.post<Project>("/api/projects", body),
  updateProject: (id: string, body: Partial<Project>) =>
    api.put<Project>(`/api/projects/${id}`, body),
  deleteProject: (id: string) => api.delete<void>(`/api/projects/${id}`),

  listMilestones: () => api.get<ProjectMilestone[]>("/api/project-milestones"),
  createMilestone: (body: MilestoneBody) =>
    api.post<ProjectMilestone>("/api/project-milestones", body),
  updateMilestone: (id: string, body: MilestoneBody) =>
    api.put<ProjectMilestone>(`/api/project-milestones/${id}`, body),
  deleteMilestone: (id: string) => api.delete<void>(`/api/project-milestones/${id}`),
};
