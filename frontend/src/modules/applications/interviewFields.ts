import type { FieldConfig } from "../../components/EntityFormModal";
import type { Application, Interview, InterviewStage } from "../../api/applications";

export const INTERVIEW_STAGES: InterviewStage[] = [
  "PHONE_SCREEN",
  "ONLINE_ASSESSMENT",
  "TECHNICAL",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "ONSITE",
  "FINAL",
];

const sharedFields: FieldConfig<Interview>[] = [
  { key: "scheduledAt", label: "Scheduled At", type: "datetime-local", required: true },
  { key: "stage", label: "Stage", type: "select", options: INTERVIEW_STAGES, required: true },
  {
    key: "format",
    label: "Format",
    type: "select",
    options: [
      { value: "", label: "—" },
      { value: "PHONE", label: "PHONE" },
      { value: "VIDEO", label: "VIDEO" },
      { value: "ONSITE", label: "ONSITE" },
    ],
  },
  { key: "interviewer", label: "Interviewer", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
];

// applicationId is fixed once an interview exists — only chosen at creation.
export const editInterviewFields = sharedFields;

export const createInterviewFields = (applications: Application[]): FieldConfig<Interview>[] => [
  {
    key: "applicationId",
    label: "Application",
    type: "select",
    required: true,
    options: applications.map((a) => ({ value: a.id, label: `${a.company} — ${a.position}` })),
  },
  ...sharedFields,
];

export function stageLabel(stage: InterviewStage): string {
  return stage.replace(/_/g, " ");
}
