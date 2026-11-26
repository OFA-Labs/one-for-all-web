import {
  createTask,
  historyRows,
  scenarios,
  type ScenarioId,
} from "@/lib/demo";
import { civilDateInZone, DEFAULT_TIME_ZONE } from "./civil";
import {
  HistoryHttpError,
  type CalendarDay,
  type EvidenceStatus,
  type HistoryClient,
  type HistoryDetail,
  type HistoryItem,
  type ListParams,
  type RangeParams,
  type TaskState,
  type Tier,
} from "./contracts";
import { displayStatus } from "./view-model";

type Row = (typeof historyRows)[number];
const MINUTE = 60_000;
// Block lengths the calendar has always used for the sample records.
const DURATION_MIN: Partial<Record<ScenarioId, number>> = {
  jobs: 70,
  social: 80,
  decline: 20,
};
const STATE: Record<string, TaskState> = {
  Verified: "completed",
  "Needs review": "waiting",
  Submitted: "completed",
  Declined: "declined",
  Paused: "paused",
  Unknown: "unknown",
};

function toItem(row: Row): HistoryItem {
  const state = STATE[row.status];
  const tier: Tier =
    row.tier === "A" || row.tier === "B" || row.tier === "unknown"
      ? row.tier
      : "none";
  const evidenceStatus: EvidenceStatus =
    tier === "A"
      ? "verified"
      : tier === "B"
        ? "submitted"
        : tier === "unknown"
          ? "unknown"
          : "none";
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    goal: scenarios[row.scenario].prompt,
    scenario: row.scenario,
    state,
    status: displayStatus(state, tier, evidenceStatus) ?? "Unknown",
    tier,
    evidenceStatus,
    occurredAt: new Date(row.timestamp).getTime(),
    durationMs: (DURATION_MIN[row.scenario] ?? 45) * MINUTE,
    isSample: true,
    resultUrl: null,
    summary: null,
  };
}

const matches = (item: HistoryItem, p: RangeParams | ListParams) => {
  const status = p.status && p.status !== "all" ? p.status : null;
  // The preview has always searched title + subtitle only.
  const text = `${item.title} ${item.subtitle}`.toLowerCase();
  return (
    (!p.q || text.includes(p.q.trim().toLowerCase())) &&
    (!status || item.status === status)
  );
};

/**
 * Preview client: the seven fictional sample records, filtered in memory. It makes no
 * network request and never pretends to be live data.
 */
export function createMockHistoryClient(): HistoryClient {
  const all = () => historyRows.map(toItem);
  const inRange = (item: HistoryItem, p: RangeParams) => {
    const day = civilDateInZone(item.occurredAt, p.tz);
    return day >= p.from && day < p.to && matches(item, p);
  };

  return {
    mode: "preview",
    async listTasks(p) {
      const tz = p.tz ?? DEFAULT_TIME_ZONE;
      const items = all()
        .filter((item) => {
          const day = civilDateInZone(item.occurredAt, tz);
          return (
            matches(item, p) &&
            (!p.from || day >= p.from) &&
            (!p.to || day < p.to)
          );
        })
        .sort((a, b) => a.occurredAt - b.occurredAt);
      if (p.sort !== "oldest") items.reverse();
      const start = Number(p.cursor ?? 0) || 0;
      const limit = p.limit ?? 20;
      const page = items.slice(start, start + limit);
      return {
        items: page,
        nextCursor: start + limit < items.length ? String(start + limit) : null,
        total: items.length,
      };
    },
    async getPeriod(p) {
      const items = all()
        .filter((item) => inRange(item, p))
        .sort((a, b) => a.occurredAt - b.occurredAt);
      return { items, total: items.length, truncated: false };
    },
    async getCalendar(p) {
      const days = new Map<string, CalendarDay>();
      for (const item of all().filter((i) => inRange(i, p))) {
        const date = civilDateInZone(item.occurredAt, p.tz);
        const day = days.get(date) ?? { date, count: 0, byStatus: {} };
        day.count += 1;
        day.byStatus[item.status] = (day.byStatus[item.status] ?? 0) + 1;
        days.set(date, day);
      }
      return {
        days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
    async getTask(id): Promise<HistoryDetail> {
      const row = historyRows.find((r) => r.id === id);
      if (!row) throw new HistoryHttpError(404, "not_found", "Task not found.");
      const item = toItem(row);
      const scenario = scenarios[row.scenario];
      const created = item.occurredAt - (item.durationMs ?? 0);
      return {
        task: {
          ...item,
          mode: "personal",
          revision: 1,
          createdAt: created,
          endedAt: item.occurredAt,
          attempt: 1,
          gateReason: null,
        },
        plan: {
          version: 1,
          hash: "sha256:preview",
          steps: scenario.steps,
          sites: scenario.sites,
          recipients: [],
        },
        events: createTask(row.scenario, row.title).events.map(
          (message, index) => ({
            seq: index + 1,
            at: created + index * MINUTE,
            type: "preview.event",
            message,
          }),
        ),
        evidence: null,
        ledger: [],
        approvals: [],
      };
    },
    async exportTask(id) {
      const detail = await this.getTask(id);
      return new Blob(
        [
          JSON.stringify(
            {
              ...detail,
              notice: "Fictional local preview, not a real audit record",
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
    },
  };
}
