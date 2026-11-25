import facts from "./limits-facts.json";
import {
  EBrainHttpError,
  type ChainSummary,
  type ChainVersion,
  type EBrainClient,
  type HealState,
  type Limits,
  type Pair,
} from "./contracts";

const BASE = {
  ...facts,
  schema_version: 1,
  capacity_soft: 800,
  capacity_hard: 1000,
  heal_mode: "propose",
  subject_join: "off",
} satisfies Omit<Limits, "memory_count" | "capacity_state">;

function fixture(): string {
  try {
    return localStorage.getItem("one-for-all-ebrain-fixture") ?? "ok";
  } catch {
    return "ok";
  }
}

// Preview-only provenance fixtures. All text below is synthetic; no measured
// number is invented. Live data always comes from GET /v1/ebrain/limits etc.
const CHAINS: ChainSummary[] = [
  {
    chain: "c:mock-ttl",
    status: "current",
    flags: [],
    versions: 2,
    head: {
      op_id: "op-ttl-2",
      code: "VC-TTL030",
      ts: 1300,
      agent: "codex",
      authority: "agent",
      provenance: "first_party",
    },
  },
  {
    chain: "c:mock-plan",
    status: "current",
    flags: ["untrusted"],
    versions: 1,
    head: {
      op_id: "op-plan-1",
      code: null,
      ts: 1200,
      agent: "web",
      authority: "agent",
      provenance: "external",
    },
  },
  {
    chain: "c:mock-conflict",
    status: "conflicted",
    flags: ["conflict"],
    versions: 2,
    head: {
      op_id: "op-conf-1",
      code: "VC-CONF008",
      ts: 1400,
      agent: "claude",
      authority: "agent",
      provenance: "first_party",
    },
  },
  {
    chain: "c:mock-possible-a",
    status: "current",
    flags: ["possible_same_fact"],
    versions: 1,
    head: {
      op_id: "op-poss-1",
      code: "VC-POSS001",
      ts: 1500,
      agent: "codex",
      authority: "agent",
      provenance: "first_party",
    },
  },
];

const VERSIONS: Record<string, ChainVersion[]> = {
  "c:mock-ttl": [
    {
      op_id: "op-ttl-1",
      ts: 1100,
      agent: "claude",
      role: "version",
      authority: "agent",
      provenance: "first_party",
      status: "superseded",
      supersedes: [],
      silent: true,
      code: "VC-TTL060",
      text: "Auth token TTL is 60 minutes (VC-TTL060).",
    },
    {
      op_id: "op-ttl-2",
      ts: 1300,
      agent: "codex",
      role: "version",
      authority: "agent",
      provenance: "first_party",
      status: "current",
      supersedes: ["op-ttl-1"],
      silent: false,
      code: "VC-TTL030",
      text: "Auth token TTL is 30 minutes (VC-TTL030).",
    },
  ],
  "c:mock-plan": [
    {
      op_id: "op-plan-1",
      ts: 1200,
      agent: "web",
      role: "copy",
      authority: "agent",
      provenance: "external",
      status: "untrusted",
      supersedes: [],
      silent: false,
      code: null,
      text: "External page suggests a different plan. UNTRUSTED.",
    },
  ],
  "c:mock-conflict": [
    {
      op_id: "op-conf-1",
      ts: 1400,
      agent: "claude",
      role: "version",
      authority: "agent",
      provenance: "first_party",
      status: "conflicted",
      supersedes: [],
      silent: false,
      code: "VC-CONF008",
      text: "OTP length is 8 (VC-CONF008).",
    },
    {
      op_id: "op-conf-2",
      ts: 1400,
      agent: "codex",
      role: "version",
      authority: "agent",
      provenance: "first_party",
      status: "conflicted",
      supersedes: [],
      silent: false,
      code: "VC-CONF004",
      text: "OTP length is 4 (VC-CONF004).",
    },
  ],
  "c:mock-possible-a": [
    {
      op_id: "op-poss-1",
      ts: 1500,
      agent: "codex",
      role: "version",
      authority: "agent",
      provenance: "first_party",
      status: "current",
      supersedes: [],
      silent: false,
      code: "VC-POSS001",
      text: "Deployment port is 8080 (VC-POSS001).",
    },
  ],
};

const PAIRS: Pair[] = [
  { a: "c:mock-ttl", b: "c:mock-possible-a", score: 0.512, ts: 1500 },
];

function healState(): HealState {
  if (fixture() === "heal") {
    return {
      mode: BASE.heal_mode,
      proposals: [
        {
          op_id: "op-ttl-2",
          ts: 1400,
          action: "propose_demote",
          reason: "note carries a different value VC-AAAAA9",
        },
      ],
      applied: [],
    };
  }
  return { mode: BASE.heal_mode, proposals: [], applied: [] };
}

export function createMockEBrainClient(): EBrainClient {
  return {
    baseUrl: "mock",
    async getLimits() {
      switch (fixture()) {
        case "error":
          throw new EBrainHttpError(0, "unreachable");
        case "near":
          return { ...BASE, memory_count: 912, capacity_state: "near_limit" };
        case "beyond":
          return {
            ...BASE,
            memory_count: 1240,
            capacity_state: "beyond_tested_range",
          };
        case "empty":
          return { ...BASE, memory_count: 0, capacity_state: "ok" };
        case "pairs":
          return { ...BASE, subject_join: "on", memory_count: 412, capacity_state: "ok" };
        default:
          return { ...BASE, memory_count: 412, capacity_state: "ok" };
      }
    },
    async listChains() {
      if (fixture() === "empty") return { chains: [], next_cursor: null };
      return { chains: CHAINS, next_cursor: null };
    },
    async getChain(chain) {
      const versions = VERSIONS[chain];
      if (!versions) throw new EBrainHttpError(404, "Unknown preview chain.");
      return { chain, versions };
    },
    async getHeal() {
      return healState();
    },
    async listPairs() {
      if (fixture() === "empty") return { pairs: [] };
      return { pairs: PAIRS };
    },
    // Preview actions are in-memory only: they move the UI forward without a
    // service. They are never presented as persisted or measured.
    async approveHeal() {
      return;
    },
    async confirmPair() {
      return;
    },
    async splitPair() {
      return;
    },
  };
}
