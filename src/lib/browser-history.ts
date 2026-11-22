import { scenarios, type Draft, type Task } from "./demo";

export type TabCapture = {
  id: string;
  title: string;
  content: string;
  kind: "request" | "plan" | "activity" | "draft" | "current";
  items?: string[];
  draft?: Draft;
};

export function tabStatus(task: Task) {
  if (task.status === "waiting") return "Ready for review";
  if (task.status === "completed") return "Task finished";
  return task.status.charAt(0).toUpperCase() + task.status.slice(1);
}

export function tabOutcome(task: Task) {
  if (task.status === "completed")
    return "The sample result is ready to inspect. No real action was performed.";
  if (task.status === "waiting")
    return "The draft is ready. Review the exact text, account and destination before anything goes out.";
  if (task.status === "permission")
    return "Waiting for site access. Permission to read is separate from approval to send.";
  if (task.status === "question")
    return "A clarification is needed before the sample task can continue.";
  if (task.status === "cancelled")
    return "The task was cancelled. Unused approvals were revoked; no automatic undo was attempted.";
  if (
    ["paused", "driving", "offline", "reconnecting", "error"].includes(
      task.status,
    )
  )
    return "The work is on hold. No further action will start until the task can safely resume.";
  return "Working inside your plan. Anything consequential waits for your approval.";
}

function activityTitle(event: string, index: number) {
  if (/cancelled|rejected/i.test(event)) return "Task stopped";
  if (/expired/i.test(event)) return "Review expired";
  if (/page changed/i.test(event)) return "Page changed";
  if (/clarification answered/i.test(event)) return "Clarification recorded";
  if (/resumed/i.test(event)) return "Task resumed";
  if (/paused/i.test(event)) return "Task paused";
  if (/approved/i.test(event)) return "Approval recorded";
  if (/access granted/i.test(event)) return "Site access granted";
  if (/receipt|comparison ready/i.test(event)) return "Result ready";
  if (/started/i.test(event)) return "Task started";
  return `Task activity ${index + 1}`;
}

// These are illustrative page captures derived from the local task record.
// Sequence numbers deliberately replace timestamps: the demo has no frame stream.
export function getTabCaptures(task: Task, site: string): TabCapture[] {
  const scenario = scenarios[task.scenario];
  return [
    {
      id: "request",
      kind: "request",
      title: "Your request",
      content: task.goal,
    },
    {
      id: "plan",
      kind: "plan",
      title: "The tab’s place in the plan",
      content: scenario.description,
      items: scenario.steps,
    },
    ...task.events.map((event, index): TabCapture => ({
      id: `activity-${index}`,
      kind: "activity",
      title: activityTitle(event, index),
      content: event,
    })),
    ...task.drafts
      .filter((draft) => draft.site === site)
      .map((draft): TabCapture => ({
        id: `draft-${draft.id}-r${task.revision}`,
        kind: "draft",
        title: draft.action,
        content: draft.text,
        draft,
      })),
    {
      id: `current-${task.status}-r${task.revision}`,
      kind: "current",
      title: tabStatus(task),
      content: tabOutcome(task),
      items: task.drafts
        .filter((draft) => draft.site === site)
        .map((draft) => draft.text),
    },
  ];
}
