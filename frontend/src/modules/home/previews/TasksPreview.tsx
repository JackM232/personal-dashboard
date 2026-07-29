import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { summarizeTasks } from "../summaries";
import { formatShortDay } from "../labels";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

export function TasksPreview() {
  const tasksQuery = useQuery(queries.tasks);
  const listsQuery = useQuery(queries.taskLists);

  if (tasksQuery.isPending || listsQuery.isPending) return <PreviewSkeleton />;
  if (tasksQuery.error || listsQuery.error) return <PreviewFailed />;

  const summary = summarizeTasks(tasksQuery.data ?? [], listsQuery.data ?? []);

  if (!summary.hasTasks) return <PreviewNote>No tasks yet.</PreviewNote>;

  return (
    <>
      {summary.totalToday === 0 ? (
        <PreviewHero value={summary.outstandingTotal} label="outstanding, none due today" />
      ) : (
        <PreviewHero
          value={summary.outstandingToday}
          label={summary.outstandingToday === 0 ? "left today — all done" : "left to do today"}
        />
      )}

      <PreviewRows>
        {summary.upcoming.map((task) => (
          <PreviewRow
            key={task.id}
            label={
              <>
                <span
                  className={`home-priority is-${task.priority.toLowerCase()}`}
                  // The dot repeats the priority, so it is decoration; the title
                  // is what a screen reader gets.
                  title={`${task.priority.toLowerCase()} priority`}
                />
                {task.title}
              </>
            }
            value={task.dueDate ? formatShortDay(task.dueDate) : undefined}
          />
        ))}
        {summary.totalToday > 0 && (
          <PreviewRow label="Done today" value={`${summary.doneToday}/${summary.totalToday}`} />
        )}
        {summary.overdue > 0 && (
          <PreviewRow label="Overdue" value={summary.overdue} tone="warn" />
        )}
      </PreviewRows>
    </>
  );
}
