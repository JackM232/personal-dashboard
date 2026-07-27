import { api } from "./client";

export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "ONLINE_ASSESSMENT"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export type WorkMode = "ONSITE" | "HYBRID" | "REMOTE";

export interface Application {
  id: string;
  userId: string;
  company: string;
  position: string;
  location: string | null;
  workMode: WorkMode | null;
  url: string | null;
  source: string | null;
  appliedAt: string | null;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const applicationsApi = {
  listApplications: () => api.get<Application[]>("/api/applications"),
  createApplication: (data: Partial<Application>) =>
    api.post<Application>("/api/applications", data),
  updateApplication: (id: string, data: Partial<Application>) =>
    api.put<void>(`/api/applications/${id}`, data),
  deleteApplication: (id: string) => api.delete<void>(`/api/applications/${id}`),
};

export type InterviewStage =
  | "PHONE_SCREEN"
  | "ONLINE_ASSESSMENT"
  | "TECHNICAL"
  | "BEHAVIORAL"
  | "SYSTEM_DESIGN"
  | "ONSITE"
  | "FINAL";

export type InterviewFormat = "PHONE" | "VIDEO" | "ONSITE";

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  stage: InterviewStage;
  format: InterviewFormat | null;
  interviewer: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  application?: Pick<Application, "id" | "company" | "position">;
}

export const interviewsApi = {
  listInterviews: () => api.get<Interview[]>("/api/interviews"),
  createInterview: (data: Partial<Interview>) => api.post<Interview>("/api/interviews", data),
  updateInterview: (id: string, data: Partial<Interview>) =>
    api.put<void>(`/api/interviews/${id}`, data),
  deleteInterview: (id: string) => api.delete<void>(`/api/interviews/${id}`),
};
