"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  connectVoice,
  type DesktopState,
  type DesktopTask,
  type EyesPreview,
  type NewPrivateItem,
  type SettingsPatch,
} from "@/lib/voice/local-development-client";

type Client = ReturnType<typeof connectVoice>;
/** Info Corpus calls; each rejects with a readable message. */
export type CorpusApi = Pick<
  Client,
  | "corpusDocuments"
  | "corpusRead"
  | "corpusSave"
  | "corpusDelete"
  | "privateItems"
  | "privateAction"
>;
const Context = createContext<{
  corpus: CorpusApi;
  state: DesktopState;
  run: (action: "connect" | "stop" | "disconnect" | "quit") => void;
  scope: (kind: string) => void;
  refresh: () => void;
  checkCompanion: () => void;
  decide: (approve: boolean) => void;
  answer: (option: string) => void;
  continueTask: () => void;
  chooseApp: (option: string) => void;
  /** Save Eyes / Hands / Voice settings on the companion. */
  saveOfa: (patch: SettingsPatch) => void;
  /** One masked, numbered screenshot, shown only on this page. */
  eyesPreview: () => Promise<EyesPreview>;
} | null>(null);
export function useDesktop() {
  const context = useContext(Context);
  if (!context) throw new Error("Desktop provider missing");
  return context;
}
export function DesktopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DesktopState>({
    status: "Checking connection",
    connected: false,
    text: "",
    apps: [],
  });
  const client = useRef<Client | null>(null);
  useEffect(() => {
    client.current = connectVoice(
      (event) => {
        setState((current) => ({
          ...current,
          ...(event.type === "app_choices"
            ? {
                choices: (
                  event.payload as unknown as {
                    options: { id: string; label: string }[];
                  }
                ).options,
              }
            : {}),
          ...(event.type === "file_result"
            ? { filePreview: event.payload.text }
            : {}),
          ...(event.type === "state" || event.type === "snapshot"
            ? { voiceState: event.payload.state }
            : {}),
          ...(event.type === "task_update"
            ? {
                task: event.payload.task_id
                  ? (event.payload as DesktopTask)
                  : null,
              }
            : {}),
          ...(event.payload.text || event.payload.code
            ? { text: event.payload.text || event.payload.code || "" }
            : {}),
        }));
      },
      (patch) => setState((current) => ({ ...current, ...patch })),
    );
    const signout = () => {
      void client.current?.disconnect().catch(() =>
        setState((current) => ({
          ...current,
          connected: false,
          status: "Revocation pending",
          text: "Companion unavailable. Keep it running and retry Disconnect to revoke desktop access.",
        })),
      );
    };
    window.addEventListener("ofa:desktop-signout", signout);
    return () => {
      window.removeEventListener("ofa:desktop-signout", signout);
      client.current?.close();
    };
  }, []);
  const run = (action: "connect" | "stop" | "disconnect" | "quit") => {
    void client.current?.[action]().catch((error) =>
      setState((current) => ({
        ...current,
        connected: action === "stop" && current.connected,
        status: "Connection needs attention",
        text: error instanceof Error ? error.message : "Connection failed.",
      })),
    );
  };
  const handle = (promise: Promise<unknown> | undefined) =>
    void promise?.catch((error: unknown) =>
      setState((current) => ({
        ...current,
        text: error instanceof Error ? error.message : "Desktop action failed.",
      })),
    );
  const checkCompanion = useCallback(() => {
    void client.current?.refreshHealth().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!state.connected) return;
    client.current
      ?.ofaSettings()
      .then((ofa) => setState((current) => ({ ...current, ofa })))
      .catch(() => setState((current) => ({ ...current, ofa: null })));
  }, [state.connected]);
  const corpus = useMemo<CorpusApi>(() => {
    const connected = () => {
      if (!client.current) throw new Error("Connect this computer first.");
      return client.current;
    };
    return {
      corpusDocuments: async () => connected().corpusDocuments(),
      corpusRead: async (name: string) => connected().corpusRead(name),
      corpusSave: async (name: string, text: string) =>
        connected().corpusSave(name, text),
      corpusDelete: async (name: string) => connected().corpusDelete(name),
      privateItems: async () => connected().privateItems(),
      privateAction: async (
        action: "unlock" | "lock" | "add" | "revoke" | "delete",
        body?: NewPrivateItem | { handle: string } | Record<string, never>,
      ) => connected().privateAction(action, body),
    };
  }, []);
  return (
    <Context.Provider
      value={{
        corpus,
        state,
        run,
        scope: (kind) => handle(client.current?.scope(kind)),
        refresh: () => handle(client.current?.refresh()),
        checkCompanion,
        decide: (approve) => {
          if (state.task) handle(client.current?.decide(state.task, approve));
        },
        answer: (option) => {
          if (state.task) handle(client.current?.answer(state.task, option));
        },
        continueTask: () => {
          if (state.task) handle(client.current?.continueTask(state.task));
        },
        chooseApp: (option) => handle(client.current?.chooseApp(option)),
        saveOfa: (patch) =>
          handle(
            client.current?.saveOfaSettings(patch).then((ofa) =>
              setState((current) => ({
                ...current,
                ofa,
                text: "Settings saved on this computer.",
              })),
            ),
          ),
        eyesPreview: () =>
          client.current
            ? client.current.eyesPreview()
            : Promise.reject(new Error("Connect this computer first.")),
      }}
    >
      {children}
    </Context.Provider>
  );
}
