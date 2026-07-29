import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { isOverdue } from "../../projects/labels";
import { summarizeProjects } from "../summaries";
import { formatShortDay } from "../labels";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

export function ProjectsPreview() {
  const projectsQuery = useQuery(queries.projects);
  const milestonesQuery = useQuery(queries.projectMilestones);

  if (projectsQuery.isPending || milestonesQuery.isPending) return <PreviewSkeleton />;
  if (projectsQuery.error || milestonesQuery.error) return <PreviewFailed />;

  const summary = summarizeProjects(projectsQuery.data ?? [], milestonesQuery.data ?? []);

  if (summary.total === 0) return <PreviewNote>No projects yet.</PreviewNote>;

  return (
    <>
      <PreviewHero
        value={summary.active}
        label={summary.active === 1 ? "project in progress" : "projects in progress"}
      />

      <PreviewRows>
        {summary.upcoming.length === 0 ? (
          <PreviewRow label="No milestones with a target date" />
        ) : (
          summary.upcoming.map((milestone) => (
            <PreviewRow
              key={milestone.id}
              label={milestone.title}
              value={formatShortDay(milestone.targetDate!)}
              tone={isOverdue(milestone) ? "warn" : undefined}
            />
          ))
        )}
        <PreviewRow label="Tracked projects" value={summary.total} />
      </PreviewRows>
    </>
  );
}
