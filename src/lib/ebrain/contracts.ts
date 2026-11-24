export type CapacityState = "ok" | "near_limit" | "beyond_tested_range";

export type Capability = {
  id: string;
  can: boolean;
  example: string;
  tier: string;
  metric: string;
  at_1k: string;
  at_10k: string;
};

export type KnownFlaw = {
  id: string;
  text: string;
  metric: string;
  at_1k: string;
  at_10k: string;
};

export type Limits = {
  schema_version: 1;
  experimental: boolean;
  memory_count: number;
  capacity_soft: number;
  capacity_hard: number;
  capacity_state: CapacityState;
  heal_mode: "off" | "propose" | "auto";
  subject_join: "off" | "on";
  copy: {
    meter_ok: string;
    meter_near: string;
    meter_beyond: string;
    capacity_note: string;
    experimental_badge: string;
    heal_state: Record<"off" | "propose" | "auto", string>;
  };
  capabilities: Capability[];
  known_flaws: KnownFlaw[];
  measured_source: string;
};

export type ChainSummary = {
  chain: string;
  status: "current" | "conflicted" | "superseded";
  flags: string[];
  versions: number;
  head: null | {
    op_id: string;
    code: string | null;
    ts: number;
    agent: string;
    authority: string;
    provenance: string;
  };
};

export type ChainVersion = {
  op_id: string;
  ts: number;
  agent: string;
  role: string;
  authority: string;
  provenance: string;
  status: string;
  supersedes: string[];
  silent: boolean;
  code: string | null;
  text: string;
};

export type Pair = { a: string; b: string; score: number; ts: number };

export type HealState = {
  mode: "off" | "propose" | "auto";
  proposals: { op_id: string; ts: number; action: string; reason: string }[];
  applied: { op_id: string; ts: number; action: string; reason: string }[];
};

export class EBrainHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "EBrainHttpError";
  }
}

export interface EBrainClient {
  readonly baseUrl: string;
  getLimits(project?: string): Promise<Limits>;
  listChains(cursor?: number): Promise<{
    chains: ChainSummary[];
    next_cursor: string | null;
  }>;
  getChain(chain: string): Promise<{ chain: string; versions: ChainVersion[] }>;
  getHeal(): Promise<HealState>;
  approveHeal(opId: string, ts: number): Promise<void>;
  listPairs(): Promise<{ pairs: Pair[] }>;
  confirmPair(a: string, b: string, ts: number): Promise<void>;
  splitPair(a: string, b: string, ts: number): Promise<void>;
}

export const DEFAULT_PROJECT = "one-for-all";
