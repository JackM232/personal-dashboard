import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import type { Application, Interview } from "../../api/applications";
import { ApplicationsTab } from "./ApplicationsTab";
import { InterviewsTab } from "./InterviewsTab";
import "./ApplicationsPage.css";

type Tab = "applications" | "interviews";

export function ApplicationsPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const [addApplicationOpen, setAddApplicationOpen] = useState(false);
  const [addInterviewOpen, setAddInterviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery(queries.applications);
  const interviewsQuery = useQuery(queries.interviews);

  function loadApplications() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.applications.applications });
  }

  function loadInterviews() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.applications.interviews });
  }

  const applications: Application[] = applicationsQuery.data ?? [];
  const interviews: Interview[] = interviewsQuery.data ?? [];
  const error = applicationsQuery.error ?? interviewsQuery.error;

  if (applicationsQuery.isPending || interviewsQuery.isPending) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error.message}</p>;

  return (
    <div>
      <div className="applications-header">
        <h1>Applications</h1>
      </div>

      <div className="applications-tabs">
        <div className="applications-tabs-list">
          <button
            type="button"
            className={`applications-tab ${tab === "applications" ? "active" : ""}`}
            onClick={() => setTab("applications")}
          >
            Applications
          </button>
          <button
            type="button"
            className={`applications-tab ${tab === "interviews" ? "active" : ""}`}
            onClick={() => setTab("interviews")}
          >
            Interviews Scheduled
          </button>
        </div>

        {tab === "applications" ? (
          <button
            type="button"
            className="add-button"
            onClick={() => setAddApplicationOpen(true)}
          >
            Add Application
          </button>
        ) : (
          <button
            type="button"
            className="add-button"
            disabled={applications.length === 0}
            onClick={() => setAddInterviewOpen(true)}
          >
            Add Interview
          </button>
        )}
      </div>

      {tab === "applications" ? (
        <ApplicationsTab
          applications={applications}
          onApplicationsChanged={loadApplications}
          addOpen={addApplicationOpen}
          onAddOpenChange={setAddApplicationOpen}
        />
      ) : (
        <InterviewsTab
          applications={applications}
          interviews={interviews}
          onInterviewsChanged={loadInterviews}
          addOpen={addInterviewOpen}
          onAddOpenChange={setAddInterviewOpen}
        />
      )}
    </div>
  );
}
