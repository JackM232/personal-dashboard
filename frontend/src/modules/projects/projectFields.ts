import type { FieldConfig } from "../../components/EntityFormModal";
import { PROJECT_KINDS, PROJECT_STATUSES, humanize, parseTechStack } from "./labels";
import type { MilestoneBody, Project, ProjectMilestone } from "./types";

function enumOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: humanize(value) }));
}

// techStack is not here: it's one comma-separated line that splits into an array,
// which FieldConfig can't express, so it lives in the modal's children slot.
// startedAt/completedAt are absent too — the server stamps them from `status`.
export const projectFields: FieldConfig<Project>[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "text" },
  { key: "kind", label: "Kind", type: "select", options: enumOptions(PROJECT_KINDS), required: true },
  { key: "status", label: "Status", type: "select", options: enumOptions(PROJECT_STATUSES), required: true },
  { key: "repoUrl", label: "Repo URL", type: "text" },
  { key: "liveUrl", label: "Live URL", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
];

// The project list is user data, so the options can't be a module constant.
export function milestoneFields(projects: Project[]): FieldConfig<ProjectMilestone>[] {
  return [
    {
      key: "projectId",
      label: "Project",
      type: "select",
      options: projects.map((project) => ({ value: project.id, label: project.name })),
      required: true,
    },
    { key: "title", label: "Milestone", type: "text", required: true },
    { key: "targetDate", label: "Target date", type: "date" },
    { key: "notes", label: "Notes", type: "text" },
  ];
}

// EntityFormModal hands every field back as a string; normalise to what the API
// expects. `tech` is folded in by the caller, which owns that input's state.
export function toProjectBody(values: Partial<Project>, tech: string): Partial<Project> {
  return {
    ...values,
    name: (values.name ?? "").trim(),
    description: values.description || null,
    repoUrl: values.repoUrl || null,
    liveUrl: values.liveUrl || null,
    notes: values.notes || null,
    techStack: parseTechStack(tech),
  };
}

// Completion is a checkbox owned by the table rather than the form, so it is
// passed separately instead of read off `values`.
export function toMilestoneBody(
  values: Partial<ProjectMilestone>,
  completed: boolean,
): MilestoneBody {
  return {
    projectId: values.projectId,
    title: (values.title ?? "").trim(),
    targetDate: values.targetDate || null,
    completed,
    notes: values.notes || null,
  };
}
