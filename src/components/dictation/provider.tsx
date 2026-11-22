"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  CONSENT_VERSION,
  type DictationSettings,
  type RecentDictation,
} from "@/lib/dictation/contracts";
import {
  dictationReducer,
  initialDictationState,
  recoveryEntry,
  type DictationAction,
  type DictationState,
} from "@/lib/dictation/model";
import { CapsLockPreviewFilter, isCapsLockEvent } from "@/lib/dictation/hotkey";
import { createMockDictationServices } from "@/lib/dictation/mock-services";
import { DictationChrome } from "./chrome";
import "./dictation.css";

const STORAGE_KEY = "one-for-all-dictation-preview-v1";
type StoredPreview = {
  settings?: Partial<DictationSettings>;
  consentVersion?: string | null;
  recent?: RecentDictation[];
  pending?: RecentDictation | null;
};
export type DictationContextValue = {
  state: DictationState;
  send: Dispatch<DictationAction>;
  consentOpen: boolean;
  shortcut: {
    presses: number;
    outcome: "waiting" | "received" | "modified" | "untrusted";
  };
  requestEnable: () => void;
  confirmEnable: () => void;
  closeConsent: () => void;
  toggle: () => void;
  disable: () => void;
  retry: (id: string) => void;
  copyText: (text: string) => Promise<void>;
};
const DictationContext = createContext<DictationContextValue | null>(null);
export function useDictation() {
  const value = useContext(DictationContext);
  if (!value) throw new Error("DictationProvider is missing");
  return value;
}
function sessionId() {
  return crypto.randomUUID();
}
function validRecent(value: unknown): value is RecentDictation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RecentDictation>;
  return (
    typeof item.id === "string" &&
    typeof item.sample === "string" &&
    item.sample.length <= 20000 &&
    typeof item.expiresAt === "number" &&
    typeof item.createdAt === "number" &&
    !!item.target &&
    ["Notepad", "Code editor", "Chat"].includes(item.target.app) &&
    (item.transcript === undefined || typeof item.transcript === "string")
  );
}

export function DictationProvider({ children }: { children: ReactNode }) {
  const [state, send] = useReducer(
    dictationReducer,
    undefined,
    initialDictationState,
  );
  const [consentOpen, setConsentOpen] = useState(false);
  // Ephemeral Caps-only feedback, never persisted or logged. No other key data.
  const [shortcut, setShortcut] = useState<DictationContextValue["shortcut"]>({
    presses: 0,
    outcome: "waiting",
  });
  const [services] = useState(createMockDictationServices);
  const snapshot = useRef(state);
  const storageWarning = useRef(false);
  useEffect(() => {
    snapshot.current = state;
  }, [state]);

  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (disposed) return;
      let stored: StoredPreview = {};
      try {
        const parsed: unknown = JSON.parse(
          sessionStorage.getItem(STORAGE_KEY) || "{}",
        );
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          stored = parsed as StoredPreview;
      } catch {
        /* Private browsing may deny storage; memory remains usable. */
      }
      const recent = Array.isArray(stored.recent)
        ? stored.recent.filter(validRecent)
        : [];
      if (validRecent(stored.pending))
        recent.unshift({
          ...stored.pending,
          reason: "Recovered after the preview closed",
          status: "saved",
        });
      send({
        type: "RESTORE",
        settings: stored.settings,
        consentVersion: stored.consentVersion,
        recent: recent.filter(
          (item, index, all) =>
            all.findIndex((other) => other.id === item.id) === index,
        ),
        now: Date.now(),
      });
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const pending =
        state.session &&
        ["LISTENING", "PROCESSING", "INSERTING"].includes(state.phase)
          ? recoveryEntry(
              {
                session: state.session,
                phase: state.phase,
                settings: state.settings,
              },
              Date.now(),
              "Preview interrupted before insertion",
              "saved",
            )
          : null;
      // Demo data ONLY. No audio bytes, file paths, native handles or keystrokes.
      // BACKEND NOT IMPLEMENTED: native private-file storage/ACL/expiry replaces this.
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings: state.settings,
          consentVersion: state.consentVersion,
          recent: state.recent,
          pending,
        }),
      );
    } catch {
      if (!storageWarning.current) {
        storageWarning.current = true;
        send({
          type: "NOTICE",
          text: "Browser recovery is unavailable. Preview sessions stay in memory.",
          now: Date.now(),
        });
      }
    }
  }, [
    state.hydrated,
    state.settings,
    state.consentVersion,
    state.recent,
    state.session,
    state.phase,
    state.elapsedMs,
  ]);

  useEffect(() => {
    const reset = () => {
      setConsentOpen(false);
      setShortcut({ presses: 0, outcome: "waiting" });
      services.disconnect();
      send({ type: "RESET", now: Date.now() });
    };
    window.addEventListener("ofa:reset-local-preview", reset);
    return () => window.removeEventListener("ofa:reset-local-preview", reset);
  }, [services]);

  const toggle = useCallback(() => {
    const active = document.activeElement;
    const blocked =
      active instanceof HTMLInputElement && active.type === "password"
        ? "password"
        : active instanceof HTMLElement &&
            active.closest("[data-dictation-overlay]")
          ? "overlay"
          : undefined;
    send({ type: "TOGGLE", id: sessionId(), blocked, now: Date.now() });
  }, []);
  const disable = useCallback(() => {
    services.disconnect();
    setShortcut({ presses: 0, outcome: "waiting" });
    send({ type: "DISABLE", now: Date.now() });
  }, [services]);

  useEffect(() => {
    if (!state.enabled || state.consentVersion !== CONSENT_VERSION) return;
    const controller = new AbortController();
    // BACKEND NOT IMPLEMENTED: connect is a mock availability check, not hook installation.
    void services
      .connect(toggle, snapshot.current.scenario, controller.signal)
      .then(() => {
        if (!controller.signal.aborted)
          send({ type: "CONNECTED", now: Date.now() });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          send({
            type: "CONNECT_FAILED",
            message: error.message,
            now: Date.now(),
          });
      });
    return () => {
      controller.abort();
      services.disconnect();
    };
  }, [
    state.enabled,
    state.consentVersion,
    state.connectionAttempt,
    services,
    toggle,
  ]);

  useEffect(() => {
    if (
      !state.enabled ||
      state.connection !== "ready" ||
      state.consentVersion !== CONSENT_VERSION ||
      services.capabilities.globalHotkey
    )
      return;
    const gate = new CapsLockPreviewFilter();
    const down = (event: KeyboardEvent) => {
      // Inspect nothing about non-trigger keys, and never store/log them.
      if (!isCapsLockEvent(event)) return;
      if (!event.isTrusted && !snapshot.current.settings.acceptInjectedKeys) {
        if (!event.repeat)
          setShortcut((previous) => ({ ...previous, outcome: "untrusted" }));
        return;
      }
      const result = gate.down(event, performance.now());
      if (result.swallow) event.preventDefault(); // Browser default ONLY; cannot reserve OS Caps.
      if (result.toggle) {
        setShortcut((previous) => ({
          presses: previous.presses + 1,
          outcome: "received",
        }));
        toggle();
      } else if (
        !event.repeat &&
        (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
      ) {
        setShortcut((previous) => ({ ...previous, outcome: "modified" }));
      }
    };
    const up = (event: KeyboardEvent) => {
      if (!isCapsLockEvent(event)) return;
      if (!event.isTrusted && !snapshot.current.settings.acceptInjectedKeys)
        return;
      if (gate.up(event, performance.now())) event.preventDefault();
    };
    const resetLatch = () => gate.reset(); // Changing focus resets a missing key-up, NOT recording.
    // Capture before text fields, Radix controls, or embedded editors can stop
    // bubbling. Do not stop propagation: unrelated page shortcuts still work.
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", resetLatch);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", resetLatch);
      gate.reset();
    };
  }, [state.enabled, state.connection, state.consentVersion, services, toggle]);

  useEffect(() => {
    const session = state.session;
    if (state.phase !== "STARTING" || !session) return;
    const controller = new AbortController();
    void services
      .startCapture(session, controller.signal)
      .then(() => {
        if (!controller.signal.aborted)
          send({
            type: "CAPTURE_READY",
            sessionId: session.id,
            now: Date.now(),
          });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          send({
            type: "FAILED",
            sessionId: session.id,
            message: error.message,
            now: Date.now(),
          });
      });
    return () => controller.abort();
  }, [state.phase, state.session, services]);

  const listeningSessionId =
    state.phase === "LISTENING" ? state.session?.id : null;
  useEffect(() => {
    const id = listeningSessionId;
    if (!id) return;
    const unsubscribe = services.subscribeLevels((levels) =>
      send({ type: "LEVELS", sessionId: id, levels, now: Date.now() }),
    );
    const timer = setInterval(
      () => send({ type: "TICK", now: Date.now() }),
      1000,
    );
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [listeningSessionId, services]);

  useEffect(() => {
    const session = state.session;
    if (state.phase !== "PROCESSING" || !session) return;
    const controller = new AbortController();
    void (async () => {
      const artifact = session.sourceRecentId
        ? await services.recoverArtifact(session, controller.signal)
        : await services.stopCapture(session, controller.signal);
      if (artifact.durationMs < 400) {
        send({ type: "EMPTY", sessionId: session.id, now: Date.now() });
        return;
      }
      const text = await services.transcribe(
        artifact,
        session,
        (progress) => {
          if (!controller.signal.aborted)
            send({
              type: "PROGRESS",
              sessionId: session.id,
              progress,
              now: Date.now(),
            });
        },
        controller.signal,
      );
      if (!controller.signal.aborted)
        send({
          type: "TEXT_READY",
          sessionId: session.id,
          text,
          now: Date.now(),
        });
    })().catch((error: Error) => {
      if (!controller.signal.aborted)
        send({
          type: "FAILED",
          sessionId: session.id,
          message: error.message,
          now: Date.now(),
        });
    });
    return () => controller.abort();
  }, [state.phase, state.session, services]);

  useEffect(() => {
    const session = state.session;
    if (state.phase !== "INSERTING" || !session) return;
    const controller = new AbortController();
    const target = {
      app:
        session.policy === "original"
          ? session.target.app
          : snapshot.current.foreground,
      condition: snapshot.current.targetCondition,
    };
    void services
      .insertText(session, target, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          send({
            type: "INSERTED",
            sessionId: session.id,
            result,
            now: Date.now(),
          });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          send({
            type: "FAILED",
            sessionId: session.id,
            message: error.message,
            now: Date.now(),
          });
      });
    return () => controller.abort();
  }, [state.phase, state.session, services]);

  useEffect(() => {
    if (state.phase !== "ERROR" || state.connection === "error") return;
    const timer = setTimeout(
      () => send({ type: "CLEAR_ERROR", now: Date.now() }),
      5000,
    );
    return () => clearTimeout(timer);
  }, [state.phase, state.connection, state.session?.id]);
  useEffect(() => {
    const timer = setInterval(
      () => send({ type: "EXPIRE", now: Date.now() }),
      60000,
    );
    return () => clearInterval(timer);
  }, []);

  const copyText = useCallback(async (text: string) => {
    // Explicit user-clicked browser copy only. Automatic fallback never touches it.
    // BACKEND NOT IMPLEMENTED: ALL-format Win32 snapshot/restore/cloud exclusion.
    try {
      await navigator.clipboard.writeText(text);
      send({
        type: "NOTICE",
        text: "Copied to your browser clipboard. The preview session is kept.",
        now: Date.now(),
      });
    } catch {
      send({
        type: "NOTICE",
        text: "Copy is unavailable. Select the transcript and copy it manually.",
        now: Date.now(),
      });
    }
  }, []);
  const value: DictationContextValue = useMemo(
    () => ({
      state,
      send,
      consentOpen,
      shortcut,
      toggle,
      disable,
      copyText,
      requestEnable: () => {
        setShortcut({ presses: 0, outcome: "waiting" });
        if (state.consentVersion === CONSENT_VERSION)
          send({ type: "ENABLE", now: Date.now() });
        else setConsentOpen(true);
      },
      confirmEnable: () => {
        setConsentOpen(false);
        send({ type: "CONSENT", now: Date.now() });
      },
      closeConsent: () => setConsentOpen(false),
      retry: (recentId: string) =>
        send({ type: "RETRY", recentId, id: sessionId(), now: Date.now() }),
    }),
    [state, consentOpen, shortcut, toggle, disable, copyText],
  );
  return (
    <DictationContext.Provider value={value}>
      {children}
      <DictationChrome api={value} />
    </DictationContext.Provider>
  );
}
