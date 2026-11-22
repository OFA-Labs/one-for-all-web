export type Role = "visitor" | "member" | "owner";
export type ScenarioId = "pr" | "jobs" | "social" | "research" | "decline";
export type TaskStatus =
  | "planning"
  | "permission"
  | "question"
  | "waiting"
  | "executing"
  | "paused"
  | "driving"
  | "offline"
  | "reconnecting"
  | "error"
  | "declined"
  | "completed"
  | "cancelled";
export type OrbState =
  | "Idle"
  | "Listening"
  | "Thinking"
  | "Speaking"
  | "Executing"
  | "Waiting"
  | "Concern"
  | "Held"
  | "You are driving"
  | "Browser offline"
  | "Reconnecting"
  | "Completed"
  | "Error"
  | "Declined";
export const orbStates: OrbState[] = [
  "Idle",
  "Listening",
  "Thinking",
  "Speaking",
  "Executing",
  "Waiting",
  "Concern",
  "Held",
  "You are driving",
  "Browser offline",
  "Reconnecting",
  "Completed",
  "Error",
  "Declined",
];
export type Draft = {
  id: string;
  site: string;
  account: string;
  action: string;
  text: string;
  selected: boolean;
  file?: string;
  declaration?: string;
};
export type Scenario = {
  id: ScenarioId;
  name: string;
  prompt: string;
  description: string;
  feature: string;
  sites: string[];
  steps: string[];
  drafts: Draft[];
};
export const scenarios: Record<ScenarioId, Scenario> = {
  pr: {
    id: "pr",
    name: "Give that PR a gentle nudge",
    prompt:
      "Check PR #142. If it isn't merged, ask the team on Slack to review it.",
    description:
      "Check GitHub, prepare a Slack message, then wait for your say-so.",
    feature: "task.start",
    sites: ["github.com", "slack.com"],
    steps: [
      "Read PR #142 in acme/voice-kit",
      "Prepare a note for the existing #engineering channel",
      "Wait for your approval",
      "Send and verify the message",
    ],
    drafts: [
      {
        id: "slack",
        site: "slack.com",
        account: "Jai · Acme workspace",
        action: "Send to #engineering",
        text: "Hey team, PR #142 is ready for review. It adds interruption handling to the voice pipeline. Could someone take a look when they have a moment?",
        selected: true,
      },
    ],
  },
  jobs: {
    id: "jobs",
    name: "Find your next ML role",
    prompt:
      "Find five ML engineer jobs above 8 LPA and prepare the best application using my resume.",
    description: "A complete application journey on our sample job board.",
    feature: "jobs.workflow",
    sites: ["playground.one-for-all.test"],
    steps: [
      "Confirm your role, salary and resume facts",
      "Compare five sample ML engineer roles",
      "Clarify relocation and prepare the form",
      "Review the resume and declarations",
      "Submit in the Playground and check the receipt",
    ],
    drafts: [
      {
        id: "application",
        site: "playground.one-for-all.test",
        account: "Jai Varma · sample applicant",
        action: "Apply to Machine Learning Engineer at Fieldwork",
        text: "Role: Machine Learning Engineer\nLocation: Gurugram · Hybrid\nExpected salary: ₹12 LPA\nExperience: 2 years\nNotice period: 30 days\nRelocation: NCR only",
        file: "Jai_Varma_Resume.pdf · sample file",
        declaration: "The applicant confirms that these facts are accurate.",
        selected: true,
      },
    ],
  },
  social: {
    id: "social",
    name: "Share something worth sharing",
    prompt:
      "Share my brother's newest video from accounts that are really mine.",
    description:
      "Four genuine-account drafts. Edit, approve some, or keep them as drafts.",
    feature: "social.workflow",
    sites: ["youtube.com", "linkedin.com", "x.com", "slack.com"],
    steps: [
      "Confirm the sample source video and real accounts",
      "Prepare four platform-specific drafts",
      "Review every recipient and exact value",
      "Commit selected items one at a time",
      "Reload and verify each result",
    ],
    drafts: [
      {
        id: "youtube",
        site: "youtube.com",
        account: "Jai Varma · real-account example",
        action: "Comment on the sample video",
        text: "Loved the explanation of how voice agents listen and respond. The interruption demo is especially good.",
        selected: true,
      },
      {
        id: "linkedin",
        site: "linkedin.com",
        account: "Jai Varma · sample profile",
        action: "Publish a post · Connections only",
        text: "My brother made a practical introduction to voice agents: listening, reasoning, and knowing when to stop. A thoughtful first project. Sharing his demo with my network.",
        selected: true,
      },
      {
        id: "x",
        site: "x.com",
        account: "@jai_builds · sample account",
        action: "Post to your followers",
        text: "A clear little walkthrough of voice agents, made by my brother. Especially liked the interruption demo. [sample video link]",
        selected: true,
      },
      {
        id: "slack",
        site: "slack.com",
        account: "Jai · Acme workspace",
        action: "Send to #side-projects",
        text: "Sharing my brother's voice-agent demo here. Would love your technical feedback when you have a minute. [sample video link]",
        selected: true,
      },
    ],
  },
  research: {
    id: "research",
    name: "Make sense of the options",
    prompt: "Compare three text-to-speech providers per million characters.",
    description:
      "Public research stays in a separate, logged-out sample browser.",
    feature: "research.workflow",
    sites: [
      "public-source-a.test",
      "public-source-b.test",
      "public-source-c.test",
    ],
    steps: [
      "Open three public sources in isolated browsers",
      "Normalize units and note assumptions",
      "Compare illustrative prices",
      "Report sources and unknowns",
    ],
    drafts: [],
  },
  decline: {
    id: "decline",
    name: "See where ONE FOR ALL draws the line",
    prompt: "Create fake accounts and use all of them to like the same video.",
    description: "A refusal preview. No workers, no tools, no tabs.",
    feature: "social.workflow",
    sites: [],
    steps: [
      "Screen request before tools",
      "Decline fake identities and fake engagement",
    ],
    drafts: [],
  },
};
export type Task = {
  id: string;
  scenario: ScenarioId;
  goal: string;
  status: TaskStatus;
  resumeStatus?: TaskStatus;
  events: string[];
  drafts: Draft[];
  revision: number;
  expired: boolean;
  evidence: "none" | "A" | "B" | "C" | "D" | "unknown";
  approved: string[];
  answer?: string;
};
export type TaskAction =
  | {
      type:
        | "advance"
        | "allow"
        | "pause"
        | "resume"
        | "cancel"
        | "change-page"
        | "expire"
        | "refresh"
        | "approve"
        | "reject"
        | "retry";
      answer?: string;
    }
  | { type: "answer"; answer: string }
  | { type: "status"; status: TaskStatus }
  | { type: "draft"; id: string; text?: string; selected?: boolean }
  | { type: "evidence"; tier: Task["evidence"] };
export function createTask(scenario: ScenarioId, goal?: string): Task {
  const s = scenarios[scenario];
  return {
    id: `preview-${scenario}`,
    scenario,
    goal: goal || s.prompt,
    status: scenario === "decline" ? "declined" : "planning",
    events:
      scenario === "decline"
        ? ["Declined: fake identities and fake engagement. No tools ran."]
        : [
            "Local preview started. No website or API has been contacted.",
            "Illustrative screening passed. This sample plan is not an AI interpretation of your words.",
          ],
    drafts: s.drafts.map((d) => ({ ...d })),
    revision: 1,
    expired: false,
    evidence: "none",
    approved: [],
  };
}
export function transition(t: Task, a: TaskAction): Task {
  const event = (
    status: TaskStatus,
    message: string,
    extra: Partial<Task> = {},
  ): Task => ({ ...t, status, ...extra, events: [...t.events, message] });
  const terminal = ["completed", "cancelled", "declined"].includes(t.status);
  switch (a.type) {
    case "advance":
      if (t.status === "planning")
        return t.scenario === "research"
          ? event(
              "executing",
              "Sample public research browsers are preparing the comparison.",
            )
          : event(
              "permission",
              "Site access is needed before this sample worker can continue.",
            );
      if (t.status === "executing")
        return event(
          "completed",
          t.scenario === "research"
            ? "Sample comparison ready. Values are illustrative, not current prices."
            : "Sample Tier A receipt read back. No real action was sent.",
          { evidence: "A" },
        );
      return t;
    case "allow":
      return t.status === "permission"
        ? event(
            t.scenario === "jobs" ? "question" : "waiting",
            "Sample site access granted. Access is not approval to submit.",
          )
        : t;
    case "answer":
      return t.status === "question" && a.answer.trim()
        ? event("waiting", `Sample clarification answered: ${a.answer}`, {
            answer: a.answer,
          })
        : t;
    case "pause":
      return !terminal && t.status !== "paused"
        ? event(
            "paused",
            "Paused locally. Nothing is lost; no new preview action will advance.",
            { resumeStatus: t.status },
          )
        : t;
    case "resume":
      return ["paused", "driving", "offline", "reconnecting"].includes(t.status)
        ? event(
            t.resumeStatus || "waiting",
            "Fresh page observation simulated; sample task resumed.",
          )
        : t;
    case "cancel":
      return !terminal
        ? event(
            "cancelled",
            "Preview cancelled. Unused approvals revoked; sample tabs left as they were.",
            { approved: [], expired: true },
          )
        : t;
    case "change-page":
      return t.status === "waiting"
        ? event(
            "waiting",
            "The sample page changed. The old approval is void; review the new revision.",
            { revision: t.revision + 1, expired: true },
          )
        : t;
    case "expire":
      return t.status === "waiting"
        ? event(
            "waiting",
            "The 24-hour review window is shown as expired. Nothing was committed.",
            { expired: true },
          )
        : t;
    case "refresh":
      return t.status === "waiting"
        ? event("waiting", "A fresh sample page reading is ready for review.", {
            expired: false,
            revision: t.revision + 1,
          })
        : t;
    case "approve":
      if (
        t.status !== "waiting" ||
        t.expired ||
        !t.drafts.some((d) => d.selected)
      )
        return t;
      return event(
        "executing",
        "Selected sample items approved. Sequential commit and verification are being illustrated.",
        { approved: t.drafts.filter((d) => d.selected).map((d) => d.id) },
      );
    case "reject":
      return t.status === "waiting"
        ? event(
            "cancelled",
            "Review rejected. Sample drafts retained; no actions sent.",
            { approved: [], expired: true },
          )
        : t;
    case "draft":
      return t.status === "waiting"
        ? {
            ...t,
            expired: a.text !== undefined ? true : t.expired,
            revision: a.text !== undefined ? t.revision + 1 : t.revision,
            drafts: t.drafts.map((d) =>
              d.id === a.id
                ? {
                    ...d,
                    ...(a.text !== undefined ? { text: a.text } : {}),
                    ...(a.selected !== undefined
                      ? { selected: a.selected }
                      : {}),
                  }
                : d,
            ),
          }
        : t;
    case "status":
      return !terminal
        ? event(a.status, `Failure-state preview: ${a.status}.`, {
            resumeStatus: ["offline", "driving", "reconnecting"].includes(
              a.status,
            )
              ? t.status
              : t.resumeStatus,
          })
        : t;
    case "retry":
      return t.status === "error"
        ? event(
            "planning",
            "One worker re-brief simulated; no real provider retry.",
          )
        : t;
    case "evidence":
      return {
        ...t,
        evidence: a.tier,
        events: [...t.events, `Evidence preview switched to tier ${a.tier}.`],
      };
  }
}
export function classifyPreview(text: string): ScenarioId {
  const v = text.toLowerCase();
  if (/fake|invent.{0,15}(people|account)|nakli/.test(v)) return "decline";
  if (/job|apply|salary|resume|naukri/.test(v)) return "jobs";
  if (/share|video|brother|post|headline/.test(v)) return "social";
  if (/compar|pricing|research|provider/.test(v)) return "research";
  return "pr";
}
// Limited preview parser, not a security classifier. Real policy is backend code + extension enforcement.
export function interruptionPreview(
  text: string,
): "pause" | "cancel" | "resume" | "none" {
  const v = text
    .toLowerCase()
    .trim()
    .replace(/[.!?,]+$/g, "");
  if (/\b(don't|dont|do not|mat)\b/.test(v) || v === "wait for approval")
    return "none";
  if (/^(continue|resume)$/.test(v)) return "resume";
  if (/^(cancel|abort|forget it)(\s|$)/.test(v)) return "cancel";
  if (/^(stop|wait|pause|hold on|ruk|ek minute)(\s|$)/.test(v)) return "pause";
  return "none";
}
export const statusToOrb: Record<TaskStatus, OrbState> = {
  planning: "Thinking",
  permission: "Waiting",
  question: "Waiting",
  waiting: "Waiting",
  executing: "Executing",
  paused: "Held",
  driving: "You are driving",
  offline: "Browser offline",
  reconnecting: "Reconnecting",
  error: "Error",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Idle",
};
export const historyRows = [
  {
    id: "sample-pr",
    title: "A gentle nudge for PR #142",
    subtitle: "GitHub → Slack",
    status: "Verified",
    date: "16 Nov, 10:24",
    timestamp: "2026-11-16T10:24:00+05:30",
    tier: "A",
    scenario: "pr" as ScenarioId,
  },
  {
    id: "sample-jobs",
    title: "ML engineer roles in NCR",
    subtitle: "Playground job board",
    status: "Needs review",
    date: "16 Nov, 09:42",
    timestamp: "2026-11-16T09:42:00+05:30",
    tier: "—",
    scenario: "jobs" as ScenarioId,
  },
  {
    id: "sample-research",
    title: "Three voices, one comparison",
    subtitle: "Public research",
    status: "Verified",
    date: "15 Nov, 18:10",
    timestamp: "2026-11-15T18:10:00+05:30",
    tier: "A",
    scenario: "research" as ScenarioId,
  },
  {
    id: "sample-social",
    title: "Share the voice-agent demo",
    subtitle: "4 genuine-account drafts",
    status: "Submitted",
    date: "15 Nov, 15:36",
    timestamp: "2026-11-15T15:36:00+05:30",
    tier: "B",
    scenario: "social" as ScenarioId,
  },
  {
    id: "sample-refusal",
    title: "Fake-account request",
    subtitle: "Declined before any tools",
    status: "Declined",
    date: "15 Nov, 14:20",
    timestamp: "2026-11-15T14:20:00+05:30",
    tier: "—",
    scenario: "decline" as ScenarioId,
  },
  {
    id: "sample-paused",
    title: "Prepare a job application",
    subtitle: "Paused for clarification",
    status: "Paused",
    date: "14 Nov, 11:08",
    timestamp: "2026-11-14T11:08:00+05:30",
    tier: "—",
    scenario: "jobs" as ScenarioId,
  },
  {
    id: "sample-unknown",
    title: "Check a message receipt",
    subtitle: "Outcome requires inspection",
    status: "Unknown",
    date: "14 Nov, 10:17",
    timestamp: "2026-11-14T10:17:00+05:30",
    tier: "unknown",
    scenario: "pr" as ScenarioId,
  },
];
export const jobRows = [
  {
    id: 1,
    title: "Machine Learning Engineer",
    company: "Fieldwork",
    location: "Gurugram",
    mode: "Hybrid",
    salary: 12,
    score: 94,
    why: "Matches ML engineering, NCR and salary floor.",
    unknown: "Team size not listed.",
  },
  {
    id: 2,
    title: "Applied AI Engineer",
    company: "Northstar Labs",
    location: "Noida",
    mode: "On-site",
    salary: 10,
    score: 88,
    why: "Voice AI experience is directly relevant.",
    unknown: "On-call expectations not stated.",
  },
  {
    id: 3,
    title: "ML Platform Engineer",
    company: "Common Ground",
    location: "Remote",
    mode: "Remote",
    salary: 14,
    score: 85,
    why: "Strong Python and deployment fit.",
    unknown: "Requires an unconfirmed cloud certification.",
  },
  {
    id: 4,
    title: "Machine Learning Engineer II",
    company: "Monsoon",
    location: "Pune",
    mode: "Hybrid",
    salary: 16,
    score: 72,
    why: "Above salary floor; relevant technical stack.",
    unknown: "Relocation conflicts with NCR preference.",
  },
  {
    id: 5,
    title: "Junior AI Engineer",
    company: "Contour",
    location: "Delhi",
    mode: "On-site",
    salary: 8.5,
    score: 79,
    why: "Entry requirements and location fit.",
    unknown: "Salary range needs a fresh source.",
  },
];
