import facts from "./limits-facts.json";
import { EBrainHttpError, type EBrainClient, type Limits } from "./contracts";

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
        default:
          return { ...BASE, memory_count: 412, capacity_state: "ok" };
      }
    },
    async listChains() {
      return { chains: [], next_cursor: null };
    },
    async getChain() {
      throw new EBrainHttpError(404, "No preview chain exists in M1.");
    },
    async getHeal() {
      return { mode: BASE.heal_mode, proposals: [], applied: [] };
    },
    async listPairs() {
      return { pairs: [] };
    },
    async approveHeal() {
      throw new EBrainHttpError(501, "Preview approvals arrive in M4.");
    },
    async confirmPair() {
      throw new EBrainHttpError(501, "Preview pair review arrives in M4.");
    },
    async splitPair() {
      throw new EBrainHttpError(501, "Preview pair review arrives in M4.");
    },
  };
}
