"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { REACTOR_SHUTDOWN_MS, REACTOR_STARTUP_MS } from "./reactor-beat";

export type ReactorPhase = "idle" | "activating" | "active" | "deactivating";
export type ReactorTransition = {
  phase: ReactorPhase;
  startedAt: number;
  duration: number;
  heartbeatAt: number;
};

export const reactorActionLabel: Record<ReactorPhase, string> = {
  idle: "ACTIVATE OFA ENGINE",
  activating: "INITIALIZING...",
  active: "DEACTIVATE OFA ENGINE",
  deactivating: "POWERING DOWN...",
};

export function reactorIsTransitioning(phase: ReactorPhase) {
  return phase === "activating" || phase === "deactivating";
}

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export function useReactorReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    // No animation before hydration has established the user's preference.
    () => true,
  );
}

/** One semantic clock for the page, stage and sidebar. Animation frames never
 * update React state. Correctness does not depend on media/animation events. */
export function useReactorController(notify: (message: string) => void) {
  const [reactor, setReactor] = useState<ReactorTransition>({
    phase: "idle",
    startedAt: 0,
    duration: 0,
    heartbeatAt: 0,
  });
  const current = useRef(reactor);
  const publish = useCallback((next: ReactorTransition) => {
    // Synchronous guard also covers multiple controls clicked in one task.
    current.current = next;
    setReactor(next);
  }, []);

  const toggle = useCallback(() => {
    if (reactorIsTransitioning(current.current.phase)) return;
    const activating = current.current.phase === "idle";
    const startedAt = performance.now();
    const duration = window.matchMedia(motionQuery).matches
      ? 180
      : activating
        ? REACTOR_STARTUP_MS
        : REACTOR_SHUTDOWN_MS;
    publish({
      phase: activating ? "activating" : "deactivating",
      startedAt,
      duration,
      heartbeatAt: activating ? startedAt : current.current.heartbeatAt,
    });
  }, [publish]);

  useEffect(() => {
    if (!reactorIsTransitioning(reactor.phase)) return;
    const timer = window.setTimeout(
      () => {
        if (current.current !== reactor) return;
        const active = reactor.phase === "activating";
        publish({
          phase: active ? "active" : "idle",
          startedAt: performance.now(),
          duration: 0,
          heartbeatAt: active ? reactor.heartbeatAt : 0,
        });
        notify(
          active
            ? "OFA Engine activated in this preview. No model or backend was connected."
            : "OFA Engine deactivated in this preview.",
        );
      },
      Math.max(0, reactor.duration - (performance.now() - reactor.startedAt)),
    );
    return () => window.clearTimeout(timer);
  }, [reactor, notify, publish]);

  const reset = useCallback(() => {
    publish({ phase: "idle", startedAt: 0, duration: 0, heartbeatAt: 0 });
  }, [publish]);

  return { reactor, toggle, reset };
}
