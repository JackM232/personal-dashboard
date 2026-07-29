export type ProjectStatus =
  | "IDEA" | "PLANNING" | "IN_PROGRESS" | "PAUSED" | "SHIPPED" | "ARCHIVED";

export type ProjectKind =
  | "WEB_APP" | "MOBILE_APP" | "CLI" | "LIBRARY" | "API"
  | "GAME" | "DATA" | "MACHINE_LEARNING" | "AUTOMATION" | "OTHER";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  kind: ProjectKind;
  status: ProjectStatus;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  // Both are stamped by the server from `status` unless the form sets them.
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: string | null;
  /** null means outstanding — the tab splits on this rather than a boolean. */
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; status: ProjectStatus };
}

// The API takes a `completed` boolean and owns the date itself, so the create
// and update bodies don't match the row shape.
export interface MilestoneBody {
  projectId?: string;
  title?: string;
  targetDate?: string | null;
  completed?: boolean;
  notes?: string | null;
}
