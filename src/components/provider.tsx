"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Check, Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { featureById, type Feature } from "@/lib/integrations";
import {
  useReactorController,
  type ReactorTransition,
} from "./reactor-transition";
import {
  createTask,
  transition,
  type Role,
  type ScenarioId,
  type Task,
  type TaskAction,
} from "@/lib/demo";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  time: string;
};

type AppContext = {
  role: Role;
  setRole: (r: Role) => void;
  /** False until the stored session has been read, so route guards do not
   * redirect a signed-in user before local storage is available. */
  authReady: boolean;
  /** The five setup steps are mandatory before the workspace is reachable. */
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  task: Task | null;
  act: (a: TaskAction) => void;
  start: (s: ScenarioId, goal?: string) => void;
  clear: () => void;
  /** Primary actions run their local preview immediately. Without a preview it
   * opens the technical integration handoff (used by "Integration details"). */
  integrate: (id: string, preview?: () => void) => void;
  notify: (s: string) => void;
  /** Sample watcher notices. Unseen ones drive the watcher eye animation. */
  notifications: AppNotification[];
  unseenCount: number;
  addWatcherNotice: (n: Omit<AppNotification, "id" | "time" | "seen">) => void;
  markSeen: (id: string) => void;
  markAllSeen: () => void;
  flags: string[];
  flag: (id: string) => void;
  /** OFA Engine is off until the user activates it in this local preview. */
  arcReactorActive: boolean;
  reactor: ReactorTransition;
  toggleArcReactor: () => void;
  reset: () => void;
};

const TASK_STORAGE_KEY = "one-for-all-preview-task";
const ROLE_STORAGE_KEY = "one-for-all-role";
const ONBOARDING_STORAGE_KEY = "one-for-all-onboarding-complete";
const SESSION_CHANGE_EVENT = "ofa:session-change";
function getStoredRole(): Role {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === "visitor" || saved === "member" || saved === "owner")
      return saved;
  } catch {
    // Storage is optional; the preview starts signed out.
  }
  return "visitor";
}
const getServerRole = () => "visitor" as Role;
function getStoredOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
const getServerOnboardingComplete = () => false;
function subscribeToSession(callback: () => void) {
  window.addEventListener(SESSION_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverNotReady = () => false;
const Context = createContext<AppContext | null>(null);
export function useApp() {
  const c = useContext(Context);
  if (!c) throw Error("Missing app provider");
  return c;
}
export function FeatureDetails({ feature: f }: { feature: Feature }) {
  return (
    <div className="feature-details">
      <div className="notice">
        <Info size={18} aria-hidden="true" />
        <span>
          Backend integration required. The contract below is proposed and is
          never called by this preview.
        </span>
      </div>
      <section>
        <h3>Purpose</h3>
        <p>{f.purpose}</p>
      </section>
      <div className="detail-columns">
        <section>
          <h3>Frontend implemented</h3>
          <ul>
            {f.frontend.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Backend implementation required</h3>
          <ul>
            {f.backend.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>
      <section>
        <h3>Data requirements</h3>
        <p>{f.data}</p>
      </section>
      <section>
        <h3>Proposed API contract</h3>
        <div className="code-label">
          {f.api.method} {f.api.path}
        </div>
        <p className="small">Authentication: {f.api.auth}</p>
        <div className="detail-columns">
          <div>
            <h4>Example request</h4>
            <pre>{JSON.stringify(f.api.request, null, 2)}</pre>
          </div>
          <div>
            <h4>Example response</h4>
            <pre>{JSON.stringify(f.api.response, null, 2)}</pre>
          </div>
        </div>
      </section>
      <section>
        <h3>Business rules and permissions</h3>
        <ul>
          {f.rules.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3>After integration</h3>
        <p>{f.success}</p>
      </section>
      <section>
        <h3>Errors and edge cases</h3>
        <ul>
          {f.errors.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <p className="muted small">
        Feature {f.id} · Source specification: {f.spec}
      </p>
    </div>
  );
}
export function AppProvider({ children }: { children: ReactNode }) {
  const role = useSyncExternalStore(
    subscribeToSession,
    getStoredRole,
    getServerRole,
  );
  const onboardingComplete = useSyncExternalStore(
    subscribeToSession,
    getStoredOnboardingComplete,
    getServerOnboardingComplete,
  );
  const authReady = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverNotReady,
  );
  const setRole = useCallback((next: Role) => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, next);
    } catch {
      // Storage is optional; the in-memory snapshot still drives the UI.
    }
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }, []);
  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Storage is optional; navigation still continues in this session.
    }
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }, []);
  const [task, dispatch] = useReducer(
    (
      t: Task | null,
      a:
        | TaskAction
        | { type: "start"; scenario: ScenarioId; goal?: string }
        | { type: "restore"; task: Task }
        | { type: "clear" },
    ) =>
      a.type === "start"
        ? createTask(a.scenario, a.goal)
        : a.type === "restore"
          ? a.task
          : a.type === "clear"
            ? null
            : t
              ? transition(t, a)
              : t,
    null,
  );
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TASK_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Task;
        if (saved?.id && saved?.scenario && saved?.status)
          dispatch({ type: "restore", task: saved });
      }
    } catch {
      // A corrupt or unavailable local store simply starts a fresh preview.
    }
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (task) localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(task));
      else localStorage.removeItem(TASK_STORAGE_KEY);
    } catch {
      // Storage is optional; in-memory state still works.
    }
  }, [task]);
  const [panel, setPanel] = useState<{
    id: string;
    preview?: () => void;
  } | null>(null);
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "pr-142",
      title: "PR #142 is still open",
      detail: "Your sample watcher is keeping an eye on it.",
      href: "/watchers",
      time: "09:42",
    },
    {
      id: "approval",
      title: "A sample approval is ready",
      detail: "Every consequential action still needs your review.",
      href: "/extension",
      time: "10:24",
    },
  ]);
  const unseenCount = notifications.length;
  const addWatcherNotice = useCallback(
    (n: Omit<AppNotification, "id" | "time">) => {
      setNotifications((xs) => [
        {
          ...n,
          id: `notice-${Date.now()}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...xs,
      ]);
    },
    [],
  );
  const markSeen = useCallback((id: string) => {
    setNotifications((xs) => xs.filter((n) => n.id !== id));
  }, []);
  const markAllSeen = useCallback(() => setNotifications([]), []);
  const [flags, setFlags] = useState<string[]>([]);
  const notify = useCallback((message: string) => setToast(message), []);
  const {
    reactor,
    toggle: toggleArcReactor,
    reset: resetReactor,
  } = useReactorController(notify);
  // Keep the operational state until the shutdown has actually finished.
  const arcReactorActive =
    reactor.phase === "active" || reactor.phase === "deactivating";
  const integrate = useCallback((id: string, preview?: () => void) => {
    if (!featureById[id]) throw Error(`Unknown feature ${id}`);
    // A primary action with a local preview should just work. Only bare
    // "Integration details" requests open the technical handoff document.
    if (preview) {
      setPanel(null);
      preview();
      return;
    }
    setPanel({ id });
  }, []);
  const start = useCallback(
    (scenario: ScenarioId, goal?: string) =>
      dispatch({ type: "start", scenario, goal }),
    [],
  );
  const act = useCallback((a: TaskAction) => dispatch(a), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!task || !["planning", "executing"].includes(task.status)) return;
    const t = setTimeout(() => dispatch({ type: "advance" }), 1300);
    return () => clearTimeout(t);
  }, [task]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const editable = el.closest(
        "input,textarea,select,button,a,[role=dialog],[contenteditable=true]",
      );
      if (e.code === "Space" && !editable && !panel && task) {
        e.preventDefault();
        dispatch({ type: task.status === "paused" ? "resume" : "pause" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [task, panel]);
  const reset = () => {
    window.dispatchEvent(new Event("ofa:reset-local-preview"));
    localStorage.removeItem("one-for-all-preview-preferences");
    localStorage.removeItem(TASK_STORAGE_KEY);
    dispatch({ type: "clear" });
    setFlags([]);
    resetReactor();
    // Resetting demo data does not sign the user out or undo the setup flow.
    notify("Local demo reset. No server account or data was deleted.");
  };
  const f = panel ? featureById[panel.id] : null;
  return (
    <Context.Provider
      value={{
        role,
        setRole,
        authReady,
        onboardingComplete,
        completeOnboarding,
        task,
        act,
        start,
        clear: () => dispatch({ type: "clear" }),
        integrate,
        notify,
        notifications,
        unseenCount,
        addWatcherNotice,
        markSeen,
        markAllSeen,
        flags,
        flag: (id) => {
          setFlags((xs) => (xs.includes(id) ? xs : [...xs, id]));
          notify(
            "Line flagged in this local preview; no feedback was submitted.",
          );
        },
        reset,
        arcReactorActive,
        reactor,
        toggleArcReactor,
      }}
    >
      {children}
      <Dialog
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent className="integration-dialog">
          <DialogHeader>
            <p className="muted small">Developer handoff · {f?.module}</p>
            <DialogTitle>{f?.name}</DialogTitle>
            <DialogDescription>
              What is built, what needs a backend, and how to connect it.
            </DialogDescription>
          </DialogHeader>
          {f && <FeatureDetails feature={f} />}
          {panel?.preview && (
            <div className="dialog-actions">
              <span className="small muted">
                No accounts, audio or external websites will be used.
              </span>
              <Button
                onClick={() => {
                  const fn = panel.preview;
                  setPanel(null);
                  fn?.();
                }}
              >
                Run local preview
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} aria-hidden="true" />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
