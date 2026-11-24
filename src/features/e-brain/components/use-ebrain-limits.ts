"use client";

import { useEffect, useState } from "react";
import type { EBrainClient, Limits } from "@/lib/ebrain/contracts";

export type LimitsState =
  | { state: "loading" }
  | { state: "error"; baseUrl: string; error: unknown }
  | { state: "ready"; data: Limits };

export function useEBrainLimits(client: EBrainClient): LimitsState {
  const [state, setState] = useState<LimitsState>({ state: "loading" });

  useEffect(() => {
    let live = true;
    client.getLimits().then(
      (data) => live && setState({ state: "ready", data }),
      (error) =>
        live && setState({ state: "error", baseUrl: client.baseUrl, error }),
    );
    return () => {
      live = false;
    };
  }, [client]);

  return state;
}
