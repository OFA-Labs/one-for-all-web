"use client";
import { useSyncExternalStore } from "react";
import type { HistoryClient } from "@/lib/history/contracts";
import { createHistoryClient, resolveHistoryBase } from "@/lib/history/client";

let cached: HistoryClient | null = null;
const subscribe = () => () => {};
const getSnapshot = () =>
  (cached ??= createHistoryClient(resolveHistoryBase()));
const getServerSnapshot = () => null;

/**
 * The History client, or null until the browser has resolved live vs preview mode.
 *
 * The server (and the first hydration render) cannot read localStorage, so they get null and
 * render a neutral skeleton; resolving the mode during server rendering would produce sample
 * data on the server and live data in the browser, a hydration mismatch. Callers must make no
 * request while this is null.
 */
export function useHistoryClient(): HistoryClient | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
