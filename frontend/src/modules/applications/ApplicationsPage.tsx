import { useEffect, useState } from "react";
import { applicationsApi, interviewsApi } from "../../api/applications";
import type { Application, Interview } from "../../api/applications";
import { ApplicationsTab } from "./ApplicationsTab";
import { InterviewsTab } from "./InterviewsTab";
import "./ApplicationsPage.css";

type Tab = "applications" | "interviews";

export function ApplicationsPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const [addApplicationOpen, setAddApplicationOpen] = useState(false);
  const [addInterviewOpen, setAddInterviewOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadApplications() {
    return applicationsApi.listApplications().then(setApplications);
  }

  function loadInterviews() {
    return interviewsApi.listInterviews().then(setInterviews);
  }

  useEffect(() => {
    Promise.all([loadApplications(), loadInterviews()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error}</p>;

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
