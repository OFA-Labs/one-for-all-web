"use client";
import { useRouter } from "next/navigation";
import { useApp } from "./provider";
import {
  createTask,
  historyRows,
  scenarios,
  type ScenarioId,
  type TaskStatus,
} from "@/lib/demo";
import {
  BrowserTiles,
  Plan,
  TaskControls,
  TaskReview,
  Timeline,
  Transcript,
} from "./task-workspace";
import { EmptyState, IntegrationButton, Notice, PageTitle } from "./common";
import { Button } from "./ui/button";
import { downloadFile } from "@/lib/utils";
export function TaskDetail({ id }: { id: string }) {
  const { task, start } = useApp();
  const router = useRouter();
  const run = (scenario: ScenarioId) => {
    start(scenario);
    router.push(`/tasks/preview-${scenario}`);
  };
  const row = historyRows.find((r) => r.id === id);
  const active = task?.id === id ? task : null;
  const sample = row ? createTask(row.scenario, row.title) : null;
  if (sample && row) {
    sample.status = (
      {
        Verified: "completed",
        "Needs review": "waiting",
        Submitted: "completed",
        Declined: "declined",
        Paused: "paused",
        Unknown: "completed",
      } as Record<string, TaskStatus>
    )[row.status];
    sample.evidence =
      row.tier === "A"
        ? "A"
        : row.tier === "B"
          ? "B"
          : row.tier === "unknown"
            ? "unknown"
            : "none";
    if (sample.status === "completed")
      sample.events.push(
        "Historical sample only. No real actions were performed.",
      );
  }
  const shown = active || sample;
  if (!shown)
    return (
      <EmptyState
        title="This preview task isn’t in memory."
        description="Task previews are intentionally temporary. A refresh clears them. Start a fresh safe task, or open sample history."
      >
        <Button
          onClick={() =>
            run(
              id.includes("jobs")
                ? "jobs"
                : id.includes("social")
                  ? "social"
                  : "pr",
            )
          }
        >
          Start a fresh local preview
        </Button>
      </EmptyState>
    );
  return (
    <>
      <PageTitle
        title={row?.title || scenarios[shown.scenario].name}
        description={`${shown.id} · sample data · no real websites or accounts used`}
        action={
          <Button
            variant="outline"
            onClick={() =>
              downloadFile(
                `${shown.id}.json`,
                JSON.stringify(
                  {
                    ...shown,
                    notice: "Fictional local preview, not a real audit record",
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            Download sample summary
          </Button>
        }
      />
      {!active && (
        <Notice>
          This historical task is read-only sample data.{" "}
          <button
            className="text-button"
            onClick={() => {
              run(shown.scenario);
            }}
          >
            Start an interactive version
          </button>
        </Notice>
      )}
      {active && <TaskControls />}
      <div className="active-task-grid">
        <div>
          {active ? (
            <TaskReview task={shown} />
          ) : (
            <section className="panel">
              <h2>{row?.status} · sample record</h2>
              <p className="mt-3">
                Evidence tier: {shown.evidence}.{" "}
                {shown.evidence === "B"
                  ? "Submitted, not yet confirmed."
                  : shown.evidence === "unknown"
                    ? "Inspect the outcome before any retry."
                    : "This is fictional sample evidence."}
              </p>
              <Button className="mt-4" onClick={() => run(shown.scenario)}>
                Start interactive preview
              </Button>
            </section>
          )}
          <Transcript task={shown} />
          <section className="panel mt-6">
            <div className="section-heading">
              <h2>Browser tabs</h2>
              <IntegrationButton id="task.events" label="Tab capture details" />
            </div>
            <BrowserTiles task={shown} large />
          </section>
        </div>
        <div>
          <Plan task={shown} />
          <Timeline task={shown} />
          <section className="panel">
            <h2>Side-effect ledger</h2>
            <p className="small mt-3">
              {shown.status === "completed"
                ? `Sample: intent → committed → ${shown.evidence === "A" ? "verified" : shown.evidence === "unknown" ? "unknown" : "awaiting confirmation"}`
                : "No real commits. The ledger is illustrative."}
            </p>
            <p className="small mt-3">
              An intent is inspected before retry. Worker claims never count as
              evidence.
            </p>
            <IntegrationButton
              id="approval.commit"
              label="Side-effect evidence details"
            />
          </section>
        </div>
      </div>
    </>
  );
}
