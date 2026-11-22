import type { DictationServices, DictationSession } from "./contracts";

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

// This is the ONLY adapter instantiated by the web app. No network calls,
// getUserMedia, MediaRecorder, Web Speech, SendInput or OS clipboard writes.
// BACKEND NOT IMPLEMENTED: replace this factory with an existing desktop-service
// adapter after native consent/security/storage implementations are available.
export function createMockDictationServices(): DictationServices {
  return {
    capabilities: {
      mode: "simulation",
      globalHotkey: false,
      nativeOverlay: false,
    },
    async connect(_onToggle, scenario, signal) {
      for (let attempt = 0; attempt < 3; attempt++) {
        await delay(120 * (attempt + 1), signal);
        if (scenario !== "hook-failure") return;
      }
      throw new Error("Inactive: keyboard preview unavailable");
    },
    disconnect() {
      /* BACKEND NOT IMPLEMENTED: native host unhooks on disconnect. */
    },
    async startCapture(session, signal) {
      await delay(500, signal);
      if (session.scenario === "mic-denied")
        throw new Error("Mic unavailable · check microphone privacy settings");
      // No microphone is opened. Resolution simulates the first audio frame.
    },
    async stopCapture(session, signal) {
      await delay(100, signal);
      return {
        kind: "simulated",
        id: session.id,
        durationMs: session.durationMs,
      };
    },
    async recoverArtifact(session, signal) {
      await delay(100, signal);
      // BACKEND NOT IMPLEMENTED: resolve a retained native artifact privately.
      return {
        kind: "simulated",
        id: session.sourceRecentId || session.id,
        durationMs: session.durationMs,
      };
    },
    subscribeLevels(onLevel) {
      let frame = 0;
      // Explicit demo meter, not measured input. Native adapter must supply REAL levels.
      const shapes = [
        [2, 5, 8, 4, 2],
        [4, 8, 3, 7, 4],
        [7, 4, 9, 5, 2],
        [3, 6, 4, 8, 5],
      ];
      const timer = setInterval(
        () => onLevel(shapes[frame++ % shapes.length]),
        180,
      );
      return () => clearInterval(timer);
    },
    async transcribe(_artifact, session, onProgress, signal) {
      await delay(500, signal);
      if (
        session.scenario === "network-error" ||
        session.scenario === "retry-once"
      ) {
        onProgress({ retry: 1 });
        await delay(550, signal);
        if (session.scenario === "network-error") {
          onProgress({ retry: 2 });
          await delay(700, signal);
          throw new Error("Connection failed · retry from Recent");
        }
      }
      if (session.scenario === "long-session") {
        for (let part = 1; part <= 4; part++) {
          onProgress({ part, totalParts: 4 });
          await delay(180, signal);
        }
      }
      return session.scenario === "empty" ? "" : session.sample;
    },
    async insertText(_session: DictationSession, target, signal) {
      await delay(350, signal);
      // Confirm ONLY an in-app sandbox update, never an external-app insertion.
      return target.condition === "normal"
        ? { kind: "confirmed", app: target.app }
        : {
            kind: "fallback",
            app: target.app,
            reason: "Window changed · preview clipboard ready",
          };
    },
  };
}
