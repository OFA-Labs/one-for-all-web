export type DesktopTask = {
  task_id: string;
  state: string;
  approval?: {
    id: string;
    reading_hash: string;
    exact_action: {
      operation: string;
      text?: string;
      target: { app?: string; path?: string; destination?: string };
    };
    reading: {
      facts: Record<string, unknown>;
      identity?: Record<string, unknown>;
    };
  };
  question?: {
    id: string;
    message: string;
    options: { id: string; label: string }[];
  };
  handoff?: { id: string; reason: string };
  error?: { code: string; message: string };
};
export type DesktopScopes = {
  window_controls?: boolean;
  read_roots?: string[];
  write_roots?: string[];
  slack_configured?: boolean;
  pending?: DesktopTask | null;
};
export type VoiceEvent = {
  protocol: "ofa.voice.v1";
  type: string;
  sequence: number;
  epoch: number;
  payload: {
    state?: string;
    text?: string;
    code?: string;
  } & Partial<DesktopTask>;
};
export type CompanionHealth = {
  service?: string;
  version?: string;
  os?: string;
  identity_mode?: string;
  llm_enabled?: boolean;
  speech?: {
    mode: string;
    language: string;
    headphones: boolean;
    command_only: boolean;
    stt_order: string[];
    tts_order: string[];
    deepgram_configured: boolean;
    gradium_configured: boolean;
    engine_enabled: boolean;
    eyes_mode?: EyesMode | null;
    eyes_ready?: boolean;
  };
};
/** How OFA understands the screen. Chosen in Settings → Eyes, stored by the companion. */
export type EyesMode = "local" | "separate" | "reasoning";
export type OfaSettings = {
  eyes: { mode: EyesMode; model: string; whole_screen: boolean };
  hands: { system_controls: boolean; answer_calls: boolean };
  voice: { reply_language: "en" | "hi" | "hinglish" };
};
export type EyesStatus = {
  mode: EyesMode;
  model: string | null;
  active: string;
  sees_images: boolean;
  reasoning_can_see: boolean;
  note: string | null;
};
export type OfaSettingsView = {
  settings: OfaSettings;
  eyes: EyesStatus;
  always_ask: string[];
};
export type SettingsPatch = {
  [Section in keyof OfaSettings]?: Partial<OfaSettings[Section]>;
};
export type EyesPreview = {
  image: string;
  masked: string;
  marks: number;
  windows: string[];
  sources: string[];
  sent_anywhere: boolean;
};
/** E-Brain → Info Corpus. "Use without consent" documents, and private items OFA can use but never see. */
export type CorpusDocument = { name: string; bytes: number; modified?: number };
export type PrivateItem = {
  handle: string;
  class: string;
  service: string;
  label: string;
  allowed_targets: string[];
  revoked: boolean | number;
};
export type PrivateView = { unlocked: boolean; items: PrivateItem[] };
export type NewPrivateItem = {
  service: string;
  label: string;
  value: string;
  site: string;
  sensitive: boolean;
};
const CORPUS_ERRORS: Record<string, string> = {
  VAULT_LOCKED: "Unlock private items first.",
  INVALID_ITEM:
    "Check the item: short lowercase names, and a website that starts with https://",
  INVALID_DOCUMENT:
    "Use a short name with letters, numbers, spaces, - or _, and under 200 KB of text.",
};
export type DesktopState = {
  status: string;
  connected: boolean;
  text: string;
  fingerprint?: string;
  voiceState?: string;
  apps: { id: string; name: string }[];
  scopes?: DesktopScopes;
  task?: DesktopTask | null;
  choices?: { id: string; label: string }[];
  filePreview?: string;
  health?: CompanionHealth;
  /** null: the companion runs without OFA's brain (no reasoning key). */
  ofa?: OfaSettingsView | null;
};
type Identity = {
  keys: CryptoKeyPair;
  grantId?: string;
  pendingRevocation?: boolean;
};
class GrantRevoked extends Error {
  constructor() {
    super("Desktop pairing was revoked. Click Connect computer to pair again.");
  }
}
const endpoint =
  process.env.NEXT_PUBLIC_OFA_COMPANION_URL || "http://127.0.0.1:8767";

function privateView(value: unknown): PrivateView {
  const view = value as Partial<PrivateView> | null;
  if (!Array.isArray(view?.items))
    throw new Error(
      "This companion does not support the Info Corpus yet. Update and restart it.",
    );
  return view as PrivateView;
}

/** Older companions do not know these settings; treat any other reply as "not available". */
function settingsView(value: unknown): OfaSettingsView {
  const view = value as Partial<OfaSettingsView> | null;
  if (!view?.settings?.eyes || !view.eyes || !Array.isArray(view.always_ask))
    throw new Error(
      "This companion does not support OFA settings yet. Update and restart it.",
    );
  return view as OfaSettingsView;
}

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ofa-desktop-pairing", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("identity");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error("Allow browser storage to retain the desktop connection."),
      );
  });
}
async function storedIdentity(value?: Identity): Promise<Identity | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        "identity",
        value ? "readwrite" : "readonly",
      );
      const store = transaction.objectStore("identity");
      const request = value
        ? store.put(value, "browser")
        : store.get("browser");
      transaction.oncomplete = () => resolve(value || request.result);
      transaction.onerror = () =>
        reject(new Error("Desktop connection could not be saved."));
      transaction.onabort = transaction.onerror;
    });
  } finally {
    db.close();
  }
}

export function connectVoice(
  onEvent: (event: VoiceEvent) => void,
  onState: (state: Partial<DesktopState>) => void,
) {
  const parsed = new URL(endpoint);
  if (
    parsed.protocol !== "http:" ||
    parsed.hostname !== "127.0.0.1" ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  )
    throw new Error("Configure an HTTP companion URL on literal 127.0.0.1.");
  let identity: Identity | undefined;
  let token = "";
  let expires = 0;
  let socket: WebSocket | null = null;
  let disposed = false;
  let enabled = false;
  let busy = false;
  let appsLoaded = false;
  let healthLoaded = false;
  let authenticating: Promise<void> | null = null;

  async function request(
    path: string,
    body?: object,
    authorized = false,
    timeout = 5000,
  ) {
    const options: RequestInit & { targetAddressSpace: "loopback" } = {
      method: body === undefined ? "GET" : "POST",
      cache: "no-store",
      credentials: "omit",
      targetAddressSpace: "loopback",
      signal: AbortSignal.timeout(timeout),
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    };
    let response: Response;
    try {
      response = await fetch(endpoint + path, options);
    } catch {
      throw new Error(
        "Companion unavailable. Start the Windows companion, then check browser local connection permission.",
      );
    }
    if (response.status === 410) throw new GrantRevoked();
    if (path.startsWith("/v1/corpus") && [400, 423].includes(response.status)) {
      const code = String((await response.json().catch(() => ({}))).code);
      if (CORPUS_ERRORS[code]) throw new Error(CORPUS_ERRORS[code]);
    }
    if (
      response.status === 404 &&
      ["/v1/ofa", "/v1/eyes", "/v1/corpus"].some((p) => path.startsWith(p))
    )
      throw new Error(
        "OFA's brain is not running. Add a reasoning key to the companion's .env file and restart it.",
      );
    if (!response.ok)
      throw new Error(
        response.status === 403
          ? "Desktop permission expired or this website origin is not allowed. Connect again."
          : "The desktop companion could not complete this request.",
      );
    return response.json();
  }
  async function authenticate() {
    if (!identity?.grantId) throw new Error("Connect this computer first.");
    let challenge;
    try {
      challenge = await request("/v1/challenge", {
        grant_id: identity.grantId,
      });
    } catch (error) {
      if (error instanceof GrantRevoked) {
        identity.grantId = undefined;
        identity.pendingRevocation = false;
        await storedIdentity(identity);
      }
      throw error;
    }
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      identity.keys.privateKey,
      new TextEncoder().encode(challenge.proof),
    );
    const result = await request("/v1/session", {
      grant_id: identity.grantId,
      challenge_id: challenge.challenge_id,
      signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
    });
    token = result.token;
    expires = Date.now() + 45000;
  }
  async function ensureSession() {
    if (token && Date.now() < expires) return;
    authenticating ??= authenticate().finally(() => {
      authenticating = null;
    });
    await authenticating;
  }
  async function observe() {
    await ensureSession();
    if (disposed || !enabled) return;
    if (socket && socket.readyState < WebSocket.CLOSING) return;
    const { ticket } = await request("/v1/ticket", {}, true);
    if (disposed || !enabled) return;
    const stream = new WebSocket(
      endpoint.replace("http:", "ws:") + "/v1/voice/events",
    );
    socket = stream;
    stream.onopen = () => stream.send(JSON.stringify({ type: "auth", ticket }));
    stream.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as VoiceEvent;
        if (event.protocol === "ofa.voice.v1") onEvent(event);
      } catch {
        onState({ text: "Recovering voice status." });
      }
    };
    stream.onclose = () => {
      if (socket === stream) socket = null;
    };
  }
  async function tick() {
    if (busy || disposed || !enabled) return;
    busy = true;
    try {
      await ensureSession();
      await request("/v1/heartbeat", {}, true);
      if (!healthLoaded) await readHealth().catch(() => undefined);
      const scopes: DesktopScopes = await request(
        "/v1/desktop/status",
        undefined,
        true,
      );
      onState({ scopes, task: scopes.pending || null });
      await observe();
      if (!appsLoaded) {
        onState({ apps: await request("/v1/apps", undefined, true) });
        appsLoaded = true;
      }
      onState({ connected: true, status: "Connected" });
    } catch (error) {
      token = "";
      appsLoaded = false;
      if (error instanceof GrantRevoked) enabled = false;
      onState({
        connected: false,
        status:
          error instanceof GrantRevoked ? "Not connected" : "Reconnecting",
        text: message(error),
      });
    } finally {
      busy = false;
    }
  }
  async function readHealth() {
    const health: CompanionHealth = await request("/v1/health");
    healthLoaded = true;
    if (!disposed) onState({ health });
  }
  async function disconnect() {
    enabled = false;
    socket?.close();
    socket = null;
    identity ??= await storedIdentity();
    if (!identity?.grantId) return;
    identity.pendingRevocation = true;
    await storedIdentity(identity);
    onState({ connected: false, status: "Disconnecting" });
    try {
      await ensureSession();
      await request("/v1/disconnect", {}, true);
    } catch (error) {
      if (!(error instanceof GrantRevoked)) throw error;
    }
    identity.grantId = undefined;
    identity.pendingRevocation = false;
    await storedIdentity(identity);
    token = "";
    appsLoaded = false;
    onState({
      connected: false,
      status: "Disconnected",
      text: "Desktop permission revoked.",
      apps: [],
      task: null,
      choices: [],
      scopes: undefined,
      filePreview: undefined,
    });
  }
  async function resume() {
    identity = await storedIdentity();
    if (disposed) return;
    if (identity?.pendingRevocation) {
      await disconnect();
      return;
    }
    if (!identity?.grantId) {
      onState({ status: "Not connected" });
      return;
    }
    enabled = true;
    await tick();
  }
  const timer = setInterval(() => {
    void tick();
  }, 2000);
  void resume().catch((error) =>
    onState({
      connected: false,
      status: "Not connected",
      text: message(error),
    }),
  );
  function message(error: unknown) {
    return error instanceof Error
      ? error.message
      : "Desktop connection failed.";
  }
  return {
    connect: async () => {
      onState({ status: "Connecting", text: "" });
      // First loopback request starts directly from the user's button action.
      await readHealth();
      identity ??= await storedIdentity();
      if (identity?.pendingRevocation) await disconnect();
      if (identity?.grantId) {
        try {
          await ensureSession();
          enabled = true;
          await tick();
          return;
        } catch (error) {
          if (!(error instanceof GrantRevoked)) throw error;
        }
      }
      if (!identity) {
        const keys = await crypto.subtle.generateKey(
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["sign", "verify"],
        );
        identity = { keys };
        await storedIdentity(identity);
      }
      const publicKey = await crypto.subtle.exportKey(
        "jwk",
        identity.keys.publicKey,
      );
      const pairing = await request("/v1/pairing", { public_key: publicKey });
      onState({
        status: "Approve on Windows",
        fingerprint: pairing.fingerprint,
        text: "Check the website and browser key shown on the desktop card, then choose Connect.",
      });
      const deadline = Date.now() + 90000;
      while (!disposed && Date.now() < deadline) {
        const result = await request(
          `/v1/pairing/${encodeURIComponent(pairing.request_id)}`,
        );
        if (result.state === "denied")
          throw new Error(
            "Desktop connection was declined. You can connect again.",
          );
        if (result.state === "approved") {
          identity.grantId = result.grant_id;
          await storedIdentity(identity);
          enabled = true;
          await tick();
          onState({
            text: "Press Caps Lock from any website, then say Open WhatsApp.",
          });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      throw new Error(
        "Connection approval timed out. Click Connect computer to retry.",
      );
    },
    refreshHealth: async () => {
      await readHealth().catch(() => {
        if (!disposed) onState({ health: undefined });
      });
    },
    stop: async () => {
      await ensureSession();
      await request("/v1/voice/stop", {}, true);
    },
    quit: async () => {
      await ensureSession();
      await request("/v1/desktop/quit", {}, true);
      enabled = false;
      healthLoaded = false;
      socket?.close();
      onState({
        connected: false,
        status: "Companion stopped",
        health: undefined,
        task: null,
        text: "OFA Desktop has quit. Saved pairing is retained. Start it from the Windows Start Menu when ready.",
      });
    },
    scope: async (kind: string) => {
      await ensureSession();
      const result = await request("/v1/desktop/scopes", { kind }, true);
      onState({
        text: "Check and approve the card on your desktop. Folder and app choices open a native picker.",
      });
      const deadline = Date.now() + 120000;
      while (!disposed && Date.now() < deadline) {
        const status = await request(
          `/v1/desktop/scopes/${encodeURIComponent(result.request_id)}`,
          undefined,
          true,
        );
        if (status.state !== "pending") {
          onState({
            text:
              status.state === "approved"
                ? "Desktop preference saved."
                : "The desktop preference was not granted.",
          });
          const scopes = await request("/v1/desktop/status", undefined, true);
          onState({ scopes, apps: await request("/v1/apps", undefined, true) });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      throw new Error(
        "Windows permission dialog is still pending. Complete it before trying again.",
      );
    },
    refresh: async () => {
      await ensureSession();
      onState({
        apps: await request("/v1/apps/refresh", {}, true),
        text: "Installed application index refreshed.",
      });
    },
    chooseApp: async (option: string) => {
      await ensureSession();
      await request("/v1/apps/choose", { option_id: option }, true);
      onState({ choices: [] });
    },
    decide: async (task: DesktopTask, approve: boolean) => {
      if (!task.approval) return;
      await ensureSession();
      await request(
        "/v1/desktop/decision",
        {
          task_id: task.task_id,
          decision: {
            command_id: crypto.randomUUID(),
            approval_id: task.approval.id,
            reading_hash: task.approval.reading_hash,
            approve,
          },
        },
        true,
      );
      onState({
        task: null,
        text: approve
          ? "Approval submitted. Waiting for actual readback."
          : "Action rejected.",
      });
    },
    answer: async (task: DesktopTask, option: string) => {
      if (!task.question) return;
      await ensureSession();
      await request(
        "/v1/desktop/answer",
        {
          task_id: task.task_id,
          answer: { question_id: task.question.id, option_id: option },
        },
        true,
      );
    },
    continueTask: async (task: DesktopTask) => {
      if (!task.handoff) return;
      await ensureSession();
      await request(
        "/v1/desktop/continue",
        { task_id: task.task_id, handoff_id: task.handoff.id },
        true,
      );
    },
    corpusDocuments: async (): Promise<CorpusDocument[]> => {
      await ensureSession();
      const reply = await request("/v1/corpus/open", undefined, true);
      return Array.isArray(reply?.documents) ? reply.documents : [];
    },
    corpusRead: async (name: string): Promise<string> => {
      await ensureSession();
      const path = `/v1/corpus/open/${encodeURIComponent(name)}`;
      return String((await request(path, undefined, true)).text ?? "");
    },
    corpusSave: async (name: string, text: string): Promise<void> => {
      await ensureSession();
      await request("/v1/corpus/open/save", { name, text }, true);
    },
    corpusDelete: async (name: string): Promise<void> => {
      await ensureSession();
      await request("/v1/corpus/open/delete", { name }, true);
    },
    privateItems: async (): Promise<PrivateView> => {
      await ensureSession();
      return privateView(await request("/v1/corpus/private", undefined, true));
    },
    privateAction: async (
      action: "unlock" | "lock" | "add" | "revoke" | "delete",
      body: NewPrivateItem | { handle: string } | Record<string, never> = {},
    ): Promise<PrivateView> => {
      await ensureSession();
      // Unlocking waits for you to answer the Windows prompt.
      const wait = action === "unlock" ? 120000 : 5000;
      return privateView(
        await request(`/v1/corpus/private/${action}`, body, true, wait),
      );
    },
    ofaSettings: async (): Promise<OfaSettingsView> => {
      await ensureSession();
      return settingsView(await request("/v1/ofa/settings", undefined, true));
    },
    saveOfaSettings: async (patch: SettingsPatch): Promise<OfaSettingsView> => {
      await ensureSession();
      return settingsView(await request("/v1/ofa/settings", patch, true));
    },
    eyesPreview: async (): Promise<EyesPreview> => {
      await ensureSession();
      return request("/v1/eyes/preview", {}, true);
    },
    disconnect,
    close: () => {
      disposed = true;
      enabled = false;
      clearInterval(timer);
      socket?.close();
    },
  };
}
