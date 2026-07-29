import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import { ProjectsTab } from "./ProjectsTab";
import { MilestonesTab } from "./MilestonesTab";
import type { Project, ProjectMilestone } from "./types";
import "./ProjectsPage.css";

type Tab = "projects" | "milestones";

export function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("projects");
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const queryClient = useQueryClient();

  const projectsQuery = useQuery(queries.projects);
  const milestonesQuery = useQuery(queries.projectMilestones);

  function loadProjects() {
    // Milestones carry a copy of their project's name and status, so a project
    // edit invalidates both lists.
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.milestones }),
    ]).then(() => {});
  }

  function loadMilestones() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.projects.milestones });
  }

  const projects: Project[] = projectsQuery.data ?? [];
  const milestones: ProjectMilestone[] = milestonesQuery.data ?? [];
  const error = projectsQuery.error ?? milestonesQuery.error;

  if (projectsQuery.isPending || milestonesQuery.isPending) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error.message}</p>;

  const inProgress = projects.filter((project) => project.status === "IN_PROGRESS").length;
  const shipped = projects.filter((project) => project.status === "SHIPPED").length;
  const outstanding = milestones.filter((milestone) => !milestone.completedAt).length;

  return (
    <div>
      <div className="projects-header">
        <h1>Projects</h1>
      </div>

      <div className="projects-stat-tiles">
        <div className="projects-stat-tile">
          <div className="projects-stat-tile-label">In progress</div>
          <div className="projects-stat-tile-value">{inProgress}</div>
        </div>
        <div className="projects-stat-tile">
          <div className="projects-stat-tile-label">Shipped</div>
          <div className="projects-stat-tile-value">{shipped}</div>
        </div>
        <div className="projects-stat-tile">
          <div className="projects-stat-tile-label">Tracked</div>
          <div className="projects-stat-tile-value">{projects.length}</div>
        </div>
        <div className="projects-stat-tile">
          <div className="projects-stat-tile-label">Open milestones</div>
          <div className="projects-stat-tile-value">{outstanding}</div>
        </div>
      </div>

      <div className="projects-tabs">
        <div className="projects-tabs-list">
          <button
            type="button"
            className={`projects-tab ${tab === "projects" ? "active" : ""}`}
            onClick={() => setTab("projects")}
          >
            Projects
          </button>
          <button
            type="button"
            className={`projects-tab ${tab === "milestones" ? "active" : ""}`}
            onClick={() => setTab("milestones")}
          >
            Milestones
          </button>
        </div>

        {tab === "projects" ? (
          <button type="button" className="add-button" onClick={() => setAddProjectOpen(true)}>
            Add Project
          </button>
        ) : (
          <button
            type="button"
            className="add-button"
            disabled={projects.length === 0}
            onClick={() => setAddMilestoneOpen(true)}
          >
            Add Milestone
          </button>
        )}
      </div>

      {tab === "projects" ? (
        <ProjectsTab
          projects={projects}
          milestones={milestones}
          onProjectsChanged={loadProjects}
          addOpen={addProjectOpen}
          onAddOpenChange={setAddProjectOpen}
        />
      ) : (
        <MilestonesTab
          projects={projects}
          milestones={milestones}
          onMilestonesChanged={loadMilestones}
          addOpen={addMilestoneOpen}
          onAddOpenChange={setAddMilestoneOpen}
        />
      )}
    </div>
  );
}
