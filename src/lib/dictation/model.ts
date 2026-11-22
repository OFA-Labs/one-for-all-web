import {
  CONSENT_VERSION,
  DEFAULT_SETTINGS,
  SAMPLE_TRANSCRIPT,
  type DictationPhase,
  type DictationProgress,
  type DictationSession,
  type DictationSettings,
  type InsertionResult,
  type MockScenario,
  type PreviewApp,
  type RecentDictation,
  type TargetCondition,
} from "./contracts";

export type TransitionRecord = {
  ts: number;
  sessionId: string | null;
  from: DictationPhase;
  event: string;
  to: DictationPhase;
};
export type DictationState = {
  hydrated: boolean;
  enabled: boolean;
  consentVersion: string | null;
  connection: "off" | "connecting" | "ready" | "error";
  connectionReason: string;
  connectionAttempt: number;
  phase: DictationPhase;
  settings: DictationSettings;
  session: DictationSession | null;
  foreground: PreviewApp;
  targetCondition: TargetCondition;
  scenario: MockScenario;
  sample: string;
  documents: Record<PreviewApp, string>;
  recent: RecentDictation[];
  notice: string;
  error: string;
  progress: DictationProgress;
  levels: number[];
  elapsedMs: number;
  pulse: number;
  minimized: boolean;
  warned: boolean;
  transitions: TransitionRecord[];
};
export function initialDictationState(): DictationState {
  return {
    hydrated: false,
    enabled: false,
    consentVersion: null,
    connection: "off",
    connectionReason: "Preview is off",
    connectionAttempt: 0,
    phase: "IDLE",
    settings: { ...DEFAULT_SETTINGS },
    session: null,
    foreground: "Notepad",
    targetCondition: "normal",
    scenario: "success",
    sample: SAMPLE_TRANSCRIPT,
    documents: { Notepad: "", "Code editor": "", Chat: "" },
    recent: [],
    notice: "",
    error: "",
    progress: {},
    levels: [2, 4, 6, 4, 2],
    elapsedMs: 0,
    pulse: 0,
    minimized: false,
    warned: false,
    transitions: [],
  };
}
export type DictationAction =
  | {
      type: "RESTORE";
      settings?: Partial<DictationSettings>;
      consentVersion?: string | null;
      recent?: RecentDictation[];
      now: number;
    }
  | {
      type:
        | "CONSENT"
        | "ENABLE"
        | "DISABLE"
        | "RECONNECT"
        | "CONNECTED"
        | "CLEAR_ERROR"
        | "CANCEL"
        | "EXPIRE"
        | "RESET";
      now: number;
    }
  | { type: "CONNECT_FAILED"; message: string; now: number }
  | { type: "SETTINGS"; patch: Partial<DictationSettings>; now: number }
  | { type: "FOREGROUND"; app: PreviewApp; now: number }
  | { type: "TARGET_CONDITION"; condition: TargetCondition; now: number }
  | { type: "SCENARIO"; scenario: MockScenario; now: number }
  | { type: "SAMPLE" | "NOTICE"; text: string; now: number }
  | { type: "DOCUMENT"; app: PreviewApp; text: string; now: number }
  | {
      type: "TOGGLE";
      id: string;
      blocked?: "password" | "overlay";
      now: number;
    }
  | { type: "CAPTURE_READY" | "EMPTY"; sessionId: string; now: number }
  | { type: "STOP"; reason: "cap" | "device-lost"; now: number }
  | { type: "INTERRUPT"; reason: string; now: number }
  | { type: "FAILED"; sessionId: string; message: string; now: number }
  | {
      type: "PROGRESS";
      sessionId: string;
      progress: DictationProgress;
      now: number;
    }
  | { type: "TEXT_READY"; sessionId: string; text: string; now: number }
  | {
      type: "INSERTED";
      sessionId: string;
      result: InsertionResult;
      now: number;
    }
  | { type: "LEVELS"; sessionId: string; levels: number[]; now: number }
  | { type: "TICK"; now: number }
  | { type: "RETRY"; recentId: string; id: string; now: number }
  | { type: "DISCARD"; recentId: string; now: number }
  | { type: "MINIMIZE"; minimized: boolean; now: number };

function move(
  state: DictationState,
  action: DictationAction,
  phase: DictationPhase,
  patch: Partial<DictationState> = {},
): DictationState {
  // Metadata only. Never put typed keys, samples or transcripts in transition logs.
  const record = {
    ts: action.now,
    sessionId: state.session?.id || ("id" in action ? action.id : null),
    from: state.phase,
    event: action.type,
    to: phase,
  };
  return {
    ...state,
    ...patch,
    phase,
    transitions: [...state.transitions, record].slice(-200),
  };
}
export function recoveryEntry(
  state: Pick<DictationState, "session" | "phase" | "settings">,
  now: number,
  reason: string,
  status: RecentDictation["status"],
): RecentDictation | null {
  const session = state.session;
  if (!session) return null;
  return {
    id: session.sourceRecentId || session.id,
    createdAt: now,
    expiresAt: now + state.settings.retainFailedAudioHours * 3600000,
    target: session.target,
    scenario: session.scenario,
    sample: session.sample,
    transcript: session.transcript,
    durationMs:
      state.phase === "LISTENING" && session.capturedAt !== undefined
        ? Math.max(session.durationMs, now - session.capturedAt)
        : session.durationMs,
    status,
    reason,
  };
}
function retain(state: DictationState, entry: RecentDictation | null) {
  return entry
    ? [entry, ...state.recent.filter((item) => item.id !== entry.id)]
    : state.recent;
}
function stopForProcessing(
  state: DictationState,
  action: DictationAction,
  notice = "",
) {
  if (!state.session) return state;
  return move(state, action, "PROCESSING", {
    session: {
      ...state.session,
      durationMs: Math.max(
        0,
        action.now - (state.session.capturedAt ?? action.now),
      ),
    },
    progress: {},
    notice,
  });
}
export function sanitizeSettings(
  patch: Partial<DictationSettings>,
): DictationSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...patch,
    trigger: "CapsLock",
    insertionTargetPolicy:
      patch.insertionTargetPolicy === "current" ? "current" : "original",
    maxRecordingMinutes: Math.min(
      240,
      Math.max(1, Number(patch.maxRecordingMinutes) || 120),
    ),
    retainFailedAudioHours: Math.min(
      168,
      Math.max(1, Number(patch.retainFailedAudioHours) || 24),
    ),
    acceptInjectedKeys: patch.acceptInjectedKeys === true,
    soundCues: patch.soundCues !== false,
    closeToTray: patch.closeToTray !== false,
  };
}

export function dictationReducer(
  state: DictationState,
  action: DictationAction,
): DictationState {
  if ("sessionId" in action && action.sessionId !== state.session?.id)
    return state;
  switch (action.type) {
    case "RESET":
      return { ...initialDictationState(), hydrated: true };
    case "RESTORE":
      return state.hydrated
        ? state
        : {
            ...state,
            hydrated: true,
            settings: sanitizeSettings(action.settings || {}),
            consentVersion:
              action.consentVersion === CONSENT_VERSION
                ? CONSENT_VERSION
                : null,
            recent: (action.recent || []).filter(
              (entry) => entry.expiresAt > action.now,
            ),
          };
    case "CONSENT":
      return {
        ...state,
        consentVersion: CONSENT_VERSION,
        enabled: true,
        connection: "connecting",
        connectionReason: "Preparing keyboard preview",
        error: "",
      };
    case "ENABLE":
      return state.consentVersion !== CONSENT_VERSION
        ? state
        : {
            ...state,
            enabled: true,
            connection: "connecting",
            connectionReason: "Preparing keyboard preview",
            error: "",
          };
    case "RECONNECT":
      return !state.enabled
        ? state
        : {
            ...state,
            connection: "connecting",
            connectionAttempt: state.connectionAttempt + 1,
            connectionReason: "Retrying keyboard preview",
            error: "",
            phase: "IDLE",
          };
    case "CONNECTED":
      return !state.enabled
        ? state
        : {
            ...state,
            connection: "ready",
            connectionReason: "Ready in this website",
          };
    case "CONNECT_FAILED":
      return move(state, action, "ERROR", {
        connection: "error",
        connectionReason: action.message,
        error: action.message,
      });
    case "DISABLE":
      return move(state, action, "IDLE", {
        enabled: false,
        connection: "off",
        connectionReason: "Preview is off",
        recent: ["LISTENING", "PROCESSING", "INSERTING"].includes(state.phase)
          ? retain(
              state,
              recoveryEntry(
                state,
                action.now,
                "Preview disabled before insertion",
                "saved",
              ),
            )
          : state.recent,
        session: null,
        error: "",
        notice: state.session
          ? "Preview disabled. The unfinished session is in Recent."
          : "Dictation preview disabled.",
      });
    case "SETTINGS":
      return {
        ...state,
        settings: sanitizeSettings({ ...state.settings, ...action.patch }),
      };
    case "FOREGROUND":
      return { ...state, foreground: action.app };
    case "TARGET_CONDITION":
      return { ...state, targetCondition: action.condition };
    case "SCENARIO":
      return { ...state, scenario: action.scenario };
    case "SAMPLE":
      return { ...state, sample: action.text };
    case "DOCUMENT":
      return {
        ...state,
        documents: { ...state.documents, [action.app]: action.text },
      };
    case "NOTICE":
      return { ...state, notice: action.text };
    case "MINIMIZE":
      return { ...state, minimized: action.minimized };
    case "TOGGLE": {
      if (
        !state.enabled ||
        state.consentVersion !== CONSENT_VERSION ||
        state.connection !== "ready"
      )
        return state;
      if (state.phase === "STARTING")
        return move(state, action, "IDLE", {
          session: null,
          notice: "Too short · startup cancelled. Nothing was captured.",
        });
      if (state.phase === "LISTENING") return stopForProcessing(state, action);
      if (state.phase === "PROCESSING" || state.phase === "INSERTING")
        return move(state, action, state.phase, { pulse: state.pulse + 1 });
      const condition = action.blocked || state.targetCondition;
      if (condition === "password" || condition === "overlay")
        return move(state, action, "ERROR", {
          session: null,
          error:
            condition === "password"
              ? "Dictation is off in password fields"
              : "Choose a text target outside the indicator",
        });
      const session: DictationSession = {
        id: action.id,
        startedAt: action.now,
        durationMs: 0,
        target: { app: state.foreground, condition },
        policy: state.settings.insertionTargetPolicy,
        scenario: state.scenario,
        sample: state.sample,
      };
      return move(state, action, "STARTING", {
        session,
        error: "",
        notice: "",
        progress: {},
        elapsedMs: 0,
        warned: false,
      });
    }
    case "CAPTURE_READY":
      return state.phase !== "STARTING" || !state.session
        ? state
        : move(state, action, "LISTENING", {
            session: { ...state.session, capturedAt: action.now },
          });
    case "STOP":
      return state.phase !== "LISTENING"
        ? state
        : stopForProcessing(
            state,
            action,
            action.reason === "cap"
              ? "Recording limit reached in preview. Processing the session."
              : "Device changed in preview. Processing the session.",
          );
    case "INTERRUPT":
      return !state.session
        ? state
        : move(state, action, "IDLE", {
            recent: retain(
              state,
              recoveryEntry(state, action.now, action.reason, "saved"),
            ),
            session: null,
            notice:
              "Interrupted preview saved to Recent. Nothing was inserted.",
          });
    case "CANCEL":
      return move(state, action, "IDLE", {
        recent: state.session?.sourceRecentId
          ? state.recent.filter(
              (entry) => entry.id !== state.session?.sourceRecentId,
            )
          : state.recent,
        session: null,
        error: "",
        notice: "Session discarded by you. Nothing was inserted.",
      });
    case "FAILED":
      return move(state, action, "ERROR", {
        recent: retain(
          state,
          recoveryEntry(
            state,
            action.now,
            action.message,
            state.phase === "INSERTING" ? "needs-copy" : "failed",
          ),
        ),
        error: action.message,
        notice: "The preview session is kept in Recent. You can retry.",
      });
    case "PROGRESS":
      return state.phase === "PROCESSING"
        ? { ...state, progress: action.progress }
        : state;
    case "EMPTY":
      return move(state, action, "IDLE", {
        session: null,
        notice:
          state.session && state.session.durationMs < 400
            ? "Too short · no transcription or insertion."
            : "No speech detected. Nothing was inserted.",
      });
    case "TEXT_READY":
      return !state.session || state.phase !== "PROCESSING"
        ? state
        : !action.text.trim()
          ? move(state, action, "IDLE", {
              session: null,
              notice: "No speech detected. Nothing was inserted.",
            })
          : move(state, action, "INSERTING", {
              session: { ...state.session, transcript: action.text },
              progress: {},
            });
    case "INSERTED": {
      if (!state.session || state.phase !== "INSERTING") return state;
      const targetChanged =
        state.session.policy === "current" &&
        action.result.app !== state.foreground;
      if (
        action.result.kind === "fallback" ||
        targetChanged ||
        state.targetCondition !== "normal"
      ) {
        const reason =
          action.result.reason || "Window changed · preview clipboard ready";
        return move(state, action, "ERROR", {
          recent: retain(
            state,
            recoveryEntry(state, action.now, reason, "needs-copy"),
          ),
          error: reason,
          notice:
            "Text is in the preview clipboard and Recent. External clipboard unchanged.",
        });
      }
      const text = state.session.transcript || "";
      const app = action.result.app;
      return move(state, action, "IDLE", {
        documents: { ...state.documents, [app]: state.documents[app] + text },
        recent: state.recent.filter(
          (entry) =>
            entry.id !== (state.session?.sourceRecentId || state.session?.id),
        ),
        session: null,
        error: "",
        notice: `Inserted in ${app} preview only. No external app was changed.`,
      });
    }
    case "CLEAR_ERROR":
      return state.phase !== "ERROR"
        ? state
        : move(state, action, "IDLE", { session: null, error: "" });
    case "LEVELS":
      return state.phase !== "LISTENING"
        ? state
        : { ...state, levels: action.levels };
    case "TICK": {
      if (
        state.phase !== "LISTENING" ||
        !state.session ||
        state.session.capturedAt === undefined
      )
        return state;
      const elapsedMs = Math.max(0, action.now - state.session.capturedAt);
      const cap = state.settings.maxRecordingMinutes * 60000;
      if (elapsedMs >= cap)
        return stopForProcessing(
          { ...state, elapsedMs },
          action,
          "Recording limit reached in preview. Processing the session.",
        );
      const warning = !state.warned && cap - elapsedMs <= 300000;
      return {
        ...state,
        elapsedMs,
        warned: state.warned || warning,
        notice: warning
          ? `Preview limit in ${Math.ceil((cap - elapsedMs) / 60000)} minutes. The session will be processed.`
          : state.notice,
      };
    }
    case "RETRY": {
      if (
        !state.enabled ||
        state.connection !== "ready" ||
        !["IDLE", "ERROR"].includes(state.phase)
      )
        return state;
      const entry = state.recent.find((item) => item.id === action.recentId);
      if (!entry) return state;
      return move(state, action, "PROCESSING", {
        session: {
          id: action.id,
          startedAt: action.now,
          durationMs: Math.max(1000, entry.durationMs),
          target: { ...entry.target, condition: state.targetCondition },
          policy: state.settings.insertionTargetPolicy,
          scenario: state.scenario,
          sample: entry.sample,
          sourceRecentId: entry.id,
        },
        progress: {},
        error: "",
        notice: "Retrying the saved preview session.",
      });
    }
    case "DISCARD":
      return {
        ...state,
        recent: state.recent.filter((entry) => entry.id !== action.recentId),
        notice: "Preview session discarded by you.",
      };
    case "EXPIRE":
      return {
        ...state,
        recent: state.recent.filter((entry) => entry.expiresAt > action.now),
      };
  }
}
