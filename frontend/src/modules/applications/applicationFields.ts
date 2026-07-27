import type { FieldConfig } from "../../components/EntityFormModal";
import type { Application, ApplicationStatus } from "../../api/applications";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

// An application can't have been sent in the future, and anything older than a
// couple of hunting seasons is a typo rather than a real date.
const APPLIED_AT_MAX_AGE_YEARS = 2;

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function earliestAppliedAt(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - APPLIED_AT_MAX_AGE_YEARS);
  return isoDate(date);
}

export const applicationFields: FieldConfig<Application>[] = [
  { key: "company", label: "Company", type: "text", required: true },
  { key: "position", label: "Position", type: "text", required: true },
  { key: "status", label: "Status", type: "select", options: APPLICATION_STATUSES, required: true },
  { key: "location", label: "Location", type: "text" },
  {
    key: "workMode",
    label: "Work Mode",
    type: "select",
    options: [
      { value: "", label: "—" },
      { value: "ONSITE", label: "ONSITE" },
      { value: "HYBRID", label: "HYBRID" },
      { value: "REMOTE", label: "REMOTE" },
    ],
  },
  {
    key: "appliedAt",
    label: "Applied On",
    type: "date",
    min: earliestAppliedAt(),
    max: isoDate(new Date()),
  },
  { key: "source", label: "Source", type: "text" },
  { key: "url", label: "Posting URL", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
];

export function statusLabel(status: ApplicationStatus): string {
  return status.replace(/_/g, " ");
}
