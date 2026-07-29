import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { projectsApi } from "./api";
import { projectFields, toProjectBody } from "./projectFields";
import {
  PROJECT_KINDS,
  PROJECT_STATUSES,
  formatDay,
  formatDuration,
  formatTechStack,
  humanize,
} from "./labels";
import type { Project, ProjectMilestone } from "./types";

const columns: SortableColumn<Project>[] = [
  { key: "name", label: "Project", type: "text", value: (p) => p.name },
  { key: "kind", label: "Kind", type: "enum", value: (p) => p.kind, options: PROJECT_KINDS },
  { key: "status", label: "Status", type: "enum", value: (p) => p.status, options: PROJECT_STATUSES },
  { key: "techStack", label: "Stack" },
  { key: "startedAt", label: "Started", type: "date", value: (p) => p.startedAt },
  // Sorts on elapsed time rather than the formatted string, so "9mo" doesn't
  // land between "1.2y" and "10d".
  {
    key: "duration",
    label: "Duration",
    type: "number",
    value: (p) =>
      p.startedAt
        ? (p.completedAt ? Date.parse(p.completedAt) : Date.now()) - Date.parse(p.startedAt)
        : null,
  },
  { key: "milestones", label: "Milestones" },
  { key: "links", label: "Links" },
];

interface ProjectsTabProps {
  projects: Project[];
  milestones: ProjectMilestone[];
  onProjectsChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function ProjectsTab({
  projects,
  milestones,
  onProjectsChanged,
  addOpen,
  onAddOpenChange,
}: ProjectsTabProps) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  // Owned here rather than by EntityFormModal: one comma-separated line that
  // splits into an array, which FieldConfig has no way to express.
  const [tech, setTech] = useState("");

  const { sorted: visible, sort, setSort } = useSortedRows(projects, columns);

  // Counted from the milestones list the page already holds rather than a
  // server-side include, so the two tabs can never disagree.
  const progress = useMemo(() => {
    const byProject = new Map<string, { done: number; total: number }>();
    for (const milestone of milestones) {
      const entry = byProject.get(milestone.projectId) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (milestone.completedAt) entry.done += 1;
      byProject.set(milestone.projectId, entry);
    }
    return byProject;
  }, [milestones]);

  // The add modal is also opened from the page header, which can't reach this
  // state — clear whenever addOpen flips to true rather than at every call
  // site, so a stack left over from an edit never leaks into a new project.
  // Adjusted during render (not an effect) so there's no stale-stack frame.
  const [prevAddOpen, setPrevAddOpen] = useState(addOpen);
  if (addOpen !== prevAddOpen) {
    setPrevAddOpen(addOpen);
    if (addOpen) setTech("");
  }

  function openEdit(project: Project) {
    setTech(formatTechStack(project.techStack));
    setEditing(project);
  }

  async function handleCreate(values: Partial<Project>) {
    await projectsApi.createProject(toProjectBody(values, tech));
    await onProjectsChanged();
  }

  async function handleUpdate(values: Partial<Project>) {
    if (!editing) return;
    await projectsApi.updateProject(editing.id, toProjectBody(values, tech));
    await onProjectsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await projectsApi.deleteProject(deleting.id);
    await onProjectsChanged();
  }

  // Hoisted above the generated fields by CSS `order` so it sits with the other
  // descriptive fields rather than after the URLs.
  const techField = (
    <label className="entity-form-field projects-tech-field">
      <span>Tech stack</span>
      <input
        type="text"
        value={tech}
        placeholder="TypeScript, React, Postgres"
        onChange={(e) => setTech(e.target.value)}
      />
    </label>
  );

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Project"
        fields={projectFields}
        initialValues={{ kind: "WEB_APP", status: "IN_PROGRESS" }}
        onSubmit={handleCreate}
        submitLabel="Add"
      >
        {techField}
      </EntityFormModal>

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Project"
        fields={projectFields}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description ?? "",
                kind: editing.kind,
                status: editing.status,
                repoUrl: editing.repoUrl ?? "",
                liveUrl: editing.liveUrl ?? "",
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
      >
        {techField}
      </EntityFormModal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={
          deleting
            ? `Delete "${deleting.name}"? Its ${progress.get(deleting.id)?.total ?? 0} milestone(s) go with it.`
            : ""
        }
        confirmLabel="Delete"
        danger
      />

      {projects.length === 0 ? (
        <p className="projects-muted">
          No projects yet.{" "}
          <button type="button" className="link-button" onClick={() => onAddOpenChange(true)}>
            Add the first one
          </button>
          .
        </p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((project) => {
              const counts = progress.get(project.id);
              return (
                <tr key={project.id}>
                  <td>
                    <div className="projects-name">{project.name}</div>
                    {project.description && (
                      <div className="projects-secondary">{project.description}</div>
                    )}
                  </td>
                  <td>{humanize(project.kind)}</td>
                  <td>
                    <span className={`projects-status status-${project.status.toLowerCase()}`}>
                      {humanize(project.status)}
                    </span>
                  </td>
                  <td>
                    {project.techStack.length === 0 ? (
                      "—"
                    ) : (
                      <div className="projects-tags">
                        {project.techStack.map((entry) => (
                          <span key={entry} className="projects-tag">
                            {entry}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{formatDay(project.startedAt)}</td>
                  <td>{formatDuration(project.startedAt, project.completedAt)}</td>
                  <td>{counts ? `${counts.done}/${counts.total}` : "—"}</td>
                  <td className="projects-links">
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noreferrer">
                        Repo
                      </a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer">
                        Live
                      </a>
                    )}
                    {!project.repoUrl && !project.liveUrl && "—"}
                  </td>
                  <td className="projects-actions">
                    <button type="button" className="link-button" onClick={() => openEdit(project)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => setDeleting(project)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
