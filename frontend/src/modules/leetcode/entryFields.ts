import type { FieldConfig } from "../../components/EntityFormModal";
import type { LeetCodeEntry, LeetCodeProblem } from "./types";

// problemId can't be changed via PUT /api/entries/:id — only the tracking fields are editable.
export const editEntryFields: FieldConfig<LeetCodeEntry>[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["UNATTEMPTED", "STARTED", "COMPLETED"],
    required: true,
  },
  { key: "hintsUsed", label: "Hints Used", type: "number" },
  { key: "timeTaken", label: "Time Taken (min)", type: "number" },
  { key: "videoWatched", label: "Video Watched", type: "checkbox" },
  { key: "notes", label: "Notes", type: "text" },
];

export const createEntryFields = (problems: LeetCodeProblem[]): FieldConfig<LeetCodeEntry>[] => [
  {
    key: "problemId",
    label: "Problem",
    type: "select",
    required: true,
    options: problems.map((p) => ({ value: p.id, label: `#${p.number} ${p.name}` })),
  },
  ...editEntryFields,
];
