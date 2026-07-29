import type { FieldConfig } from "../../components/EntityFormModal";
import type { WorkoutSession } from "../../api/gym";

export const sessionFields: FieldConfig<WorkoutSession>[] = [
  { key: "performedAt", label: "Date", type: "date", required: true },
  { key: "name", label: "Name", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
];
