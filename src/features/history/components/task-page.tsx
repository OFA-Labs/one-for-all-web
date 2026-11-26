"use client";
import { TaskDetail } from "@/components/tasks/task-detail";
import { useHistoryClient } from "../hooks/use-history-client";
import { HistoryTaskDetail } from "./history-task-detail";

/**
 * /tasks/[id]. Preview mode, and the local interactive "preview-*" tasks started from the home
 * workspace, keep the existing sample TaskDetail. Live mode shows the stored audit record.
 */
export function HistoryTaskPage({ id }: { id: string }) {
  const client = useHistoryClient();
  if (!client)
    return (
      <div className="hc-empty-period" role="status" aria-busy="true">
        <h3>Loading task…</h3>
      </div>
    );
  if (client.mode === "preview" || id.startsWith("preview-"))
    return <TaskDetail id={id} />;
  return <HistoryTaskDetail client={client} id={id} />;
}
