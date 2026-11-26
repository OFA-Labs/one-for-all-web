/** Wire-shaped (snake_case) History API fixtures for tests. Fictional data only. */
import type { ApiDetail, ApiItem } from "../../src/lib/history/view-model";

const MIN = 60_000;
export const T = (iso: string) => new Date(iso).getTime();

export function apiItem(overrides: Partial<ApiItem> = {}): ApiItem {
  return {
    task_id: "sample-pr",
    title: "A gentle nudge for PR #142",
    subtitle: "GitHub → Slack",
    goal: "Check PR #142. If it isn't merged, ask the team on Slack to review it.",
    scenario: "pr",
    state: "completed",
    display_status: "Verified",
    tier: "A",
    evidence_status: "verified",
    occurred_at: T("2026-11-16T10:24:00+05:30"),
    duration_ms: 45 * MIN,
    is_sample: true,
    result_url: "https://slack.test/archives/sample",
    summary: "Message sent and read back.",
    ...overrides,
  };
}

export const ITEMS: ApiItem[] = [
  apiItem(),
  apiItem({
    task_id: "sample-jobs",
    title: "ML engineer roles in NCR",
    subtitle: "Playground job board",
    state: "waiting",
    display_status: "Needs review",
    tier: "none",
    evidence_status: "none",
    occurred_at: T("2026-11-16T09:42:00+05:30"),
    duration_ms: 70 * MIN,
    result_url: null,
    summary: null,
  }),
  apiItem({
    task_id: "real-1",
    title: "A real task, not a demo",
    subtitle: "Recorded by the engine",
    occurred_at: T("2026-11-15T18:10:00+05:30"),
    is_sample: false,
  }),
];

export function apiDetail(overrides: Partial<ApiDetail> = {}): ApiDetail {
  const item = ITEMS[0];
  return {
    task: {
      ...item,
      mode: "personal",
      revision: 1,
      created_at: item.occurred_at - 45 * MIN,
      ended_at: item.occurred_at,
      attempt: 1,
      gate_reason: "Level 2 · send on the user's behalf",
    },
    plan: {
      version: 1,
      hash: "sha256:" + "ab".repeat(32),
      steps: ["Read PR #142 in acme/voice-kit", "Send and verify the message"],
      sites: ["github.com", "slack.com"],
      recipients: ["#engineering"],
    },
    events: [
      {
        seq: 1,
        at: item.occurred_at - 45 * MIN,
        type: "task.started",
        message: "Task started.",
      },
      {
        seq: 2,
        at: item.occurred_at,
        type: "evidence.verified",
        message: "Message read back.",
      },
    ],
    evidence: {
      tier: "A",
      status: "verified",
      item_id: "slack-msg-sample-142",
      url: "https://slack.test/archives/sample",
      readback: "Message visible in #engineering at revision 1.",
      snapshot_hash: "sha256:" + "cd".repeat(32),
      captured_at: item.occurred_at - MIN,
      verified_at: item.occurred_at,
      expires_at: null,
    },
    ledger: [
      {
        idempotency_key: "slack:send:#engineering:sha256:abcdef0123456789",
        site: "slack.com",
        target: "#engineering",
        action: "send_message",
        payload_hash: "sha256:" + "ef".repeat(32),
        state: "verified",
        created_at: item.occurred_at - 16 * MIN,
        transitions: [
          {
            seq: 1,
            at: item.occurred_at - 16 * MIN,
            from: null,
            to: "intent",
            note: "before commit",
          },
          {
            seq: 2,
            at: item.occurred_at - 8 * MIN,
            from: "intent",
            to: "committed",
            note: "click acknowledged",
          },
          {
            seq: 3,
            at: item.occurred_at,
            from: "committed",
            to: "verified",
            note: "read back",
          },
        ],
      },
    ],
    approvals: [
      {
        approval_id: "sample-pr:ap:1",
        page_url: "https://slack.test/archives/sample",
        plan_version: 1,
        payload_hash: "sha256:" + "ef".repeat(32),
        exact_text: "Hey team, PR #142 is ready for review.",
        decision: "approved",
        decided_at: item.occurred_at - 16 * MIN,
        expires_at: item.occurred_at - 5 * MIN,
        note: null,
      },
    ],
    ...overrides,
  };
}
