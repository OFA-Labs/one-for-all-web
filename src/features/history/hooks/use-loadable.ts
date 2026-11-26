"use client";
import { useEffect, useRef, useState } from "react";
import type { HistoryClient } from "@/lib/history/contracts";

export type Loadable<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

/**
 * Runs `load` whenever `key` changes (null disables it), aborting the previous request.
 * `key` must fully describe `load`'s inputs. While the key changes, the old result is never
 * shown for the new key: the state is "loading" until the matching response arrives.
 */
export function useLoadable<T>(
  client: HistoryClient | null,
  key: string | null,
  load: (client: HistoryClient, signal: AbortSignal) => Promise<T>,
): { state: Loadable<T>; retry: () => void } {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    value: Loadable<T>;
  } | null>(null);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const fullKey = key === null ? null : `${key}#${nonce}`;

  useEffect(() => {
    if (!client || fullKey === null) return;
    const controller = new AbortController();
    loadRef.current(client, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ key: fullKey, value: { status: "ready", data } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({ key: fullKey, value: { status: "error", error } });
      },
    );
    return () => controller.abort();
  }, [client, fullKey]);

  const state: Loadable<T> =
    !client || fullKey === null
      ? { status: "idle" }
      : result && result.key === fullKey
        ? result.value
        : { status: "loading" };
  return { state, retry: () => setNonce((n) => n + 1) };
}
