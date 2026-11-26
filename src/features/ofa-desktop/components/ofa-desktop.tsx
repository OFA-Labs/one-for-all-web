"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Engine = {
  id: string;
  model: string;
  vision: boolean;
  tools: boolean;
  context: number;
  metrics: Record<string, unknown>;
};
type Status = {
  session: {
    session: string;
    caption: string;
    mic: boolean;
    pending: null | {
      verb: string;
      payload: string | null;
      to: string[];
      files: string[];
      account: string | null;
    };
  };
  epoch: number;
  engine: Engine;
  keys: Record<string, boolean>;
  vault: { unlocked: boolean; items: number };
  voice: {
    active: boolean;
    mode: string | null;
    stt_routes: Record<string, string[]>;
  };
  live_calls: Record<string, number>;
  events: { ts: number; kind: string; [k: string]: unknown }[];
};
type Memory = {
  mappings: Record<string, string>;
  profile: Record<string, unknown>;
};
type AuditEntry = {
  ts: number;
  kind: string;
  tier?: number;
  result?: string;
  detail?: string;
};

const STATE_LABEL: Record<string, string> = {
  off: "Off",
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  acting: "Working",
  speaking: "Speaking",
  awaiting_approval: "Waiting for your spoken yes or no",
  error: "Needs attention",
};

function readConnection(): { port: string; token: string } {
  if (typeof window === "undefined") return { port: "8768", token: "" };
  const hash = new URLSearchParams(window.location.hash.slice(1));
  let token = hash.get("token") ?? "";
  let port = hash.get("port") ?? "";
  try {
    if (token) {
      sessionStorage.setItem("ofa_token", token);
      sessionStorage.setItem("ofa_port", port || "8768");
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      token = sessionStorage.getItem("ofa_token") ?? "";
      port = sessionStorage.getItem("ofa_port") ?? "";
    }
  } catch {
    /* storage can be blocked; the fragment still works for this view */
  }
  return { port: port || "8768", token };
}

export function OfaDesktop() {
  const [conn, setConn] = useState<{ port: string; token: string }>({
    port: "8768",
    token: "",
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string>("");
  const [memory, setMemory] = useState<Memory | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [command, setCommand] = useState("");
  const [reply, setReply] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setConn(readConnection()), 0);
    return () => clearTimeout(id);
  }, []);
  const base = useMemo(() => `http://127.0.0.1:${conn.port}`, [conn.port]);

  const call = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(base + path, {
        ...init,
        headers: {
          authorization: `Bearer ${conn.token}`,
          "content-type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(
          response.status === 401 ? "unauthorized" : `HTTP ${response.status}`,
        );
      return (await response.json()) as T;
    },
    [base, conn.token],
  );

  const refresh = useCallback(async () => {
    if (!conn.token) return;
    try {
      setStatus(await call<Status>("/status"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unreachable");
    }
  }, [call, conn.token]);

  const refreshSide = useCallback(async () => {
    if (!conn.token) return;
    try {
      setMemory(await call<Memory>("/memory"));
      const a = await call<{ entries: AuditEntry[] }>("/audit?last=15");
      setAudit(a.entries.slice().reverse());
    } catch {
      /* status shows the connection problem */
    }
  }, [call, conn.token]);

  useEffect(() => {
    const first = setTimeout(() => {
      void refresh();
      void refreshSide();
    }, 0);
    timer.current = setInterval(() => void refresh(), 1500);
    return () => {
      clearTimeout(first);
      if (timer.current) clearInterval(timer.current);
    };
  }, [refresh, refreshSide]);

  const send = async () => {
    if (!command.trim()) return;
    setBusy(true);
    setReply("");
    try {
      const r = await call<{ status: string; spoken: string }>("/command", {
        method: "POST",
        body: JSON.stringify({ text: command }),
      });
      setReply(`${r.spoken} (${r.status})`);
      setCommand("");
      void refreshSide();
    } catch (e) {
      setReply(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    try {
      await call("/session/toggle", { method: "POST" });
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  };

  const forget = async (key: string) => {
    await call(`/memory/${encodeURIComponent(key)}`, { method: "DELETE" });
    void refreshSide();
  };

  const state = status?.session.session ?? "off";
  const connected = Boolean(status) && !error;

  if (!conn.token) {
    return (
      <main className="ofa-desk" aria-labelledby="ofa-title">
        <h1 id="ofa-title">OFA Desktop</h1>
        <section className="ofa-card" data-testid="ofa-connect">
          <h2>Connect to OFA on this computer</h2>
          <p className="ofa-muted">
            Start OFA in the API folder with{" "}
            <code>.venv-ofa\Scripts\python.exe -m ofa</code>. It prints a
            Dashboard link that carries a one-time local access token. Open that
            link here.
          </p>
          <p className="ofa-muted">
            OFA only listens on 127.0.0.1. Nothing on this page is sent to the
            internet.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="ofa-desk" aria-labelledby="ofa-title">
      <header className="ofa-head">
        <div>
          <h1 id="ofa-title">OFA Desktop</h1>
          <p className="ofa-muted">
            Press Caps Lock to start or end a session. Consequential actions
            need your spoken yes.
          </p>
        </div>
        <div className={`ofa-pill ${connected ? "ok" : "bad"}`} role="status">
          {connected
            ? "Connected"
            : `Not connected${error ? `: ${error}` : ""}`}
        </div>
      </header>

      <section className="ofa-grid">
        <article className="ofa-card ofa-session" aria-label="Session">
          <div className={`ofa-orb s-${state}`} aria-hidden="true" />
          <div>
            <h2>{STATE_LABEL[state] ?? state}</h2>
            <p className="ofa-caption">{status?.session.caption || "—"}</p>
            <p className="ofa-muted">
              Microphone{" "}
              {status?.session.mic
                ? "live (streaming to the speech provider)"
                : "off"}{" "}
              · epoch {status?.epoch ?? 0}
            </p>
            <button
              type="button"
              className="ofa-btn"
              onClick={toggle}
              disabled={!connected}
            >
              {status?.voice.active ? "End session" : "Start session"}
            </button>
          </div>
        </article>

        <article className="ofa-card" aria-label="Pending approval">
          <h2>Pending approval</h2>
          {status?.session.pending ? (
            <div className="ofa-pending">
              <p>
                <strong>{status.session.pending.verb}</strong>
                {status.session.pending.to?.length
                  ? ` → ${status.session.pending.to.join(", ")}`
                  : ""}
                {status.session.pending.account
                  ? ` · from ${status.session.pending.account}`
                  : ""}
              </p>
              {status.session.pending.payload ? (
                <pre>{status.session.pending.payload}</pre>
              ) : null}
              {status.session.pending.files?.length ? (
                <p>Files: {status.session.pending.files.join(", ")}</p>
              ) : null}
              <p className="ofa-muted">
                Say “yes” / “haan” to approve or “no” / “nahi” to cancel.
                Clicking can’t approve.
              </p>
            </div>
          ) : (
            <p className="ofa-muted">Nothing waiting.</p>
          )}
        </article>

        <article className="ofa-card" aria-label="Reasoning engine">
          <h2>Reasoning engine</h2>
          <dl className="ofa-dl">
            <dt>Engine</dt>
            <dd>
              {status?.engine.id ?? "—"} · {status?.engine.model ?? ""}
            </dd>
            <dt>Vision</dt>
            <dd>
              {status
                ? status.engine.vision
                  ? "yes"
                  : "no (uses accessibility + on-device OCR)"
                : "—"}
            </dd>
            <dt>Latency p50</dt>
            <dd>{String(status?.engine.metrics?.latency_p50_ms ?? "—")} ms</dd>
            <dt>Calls / tokens</dt>
            <dd>
              {String(status?.engine.metrics?.calls ?? 0)} /{" "}
              {String(status?.engine.metrics?.input_tokens ?? 0)} in
            </dd>
          </dl>
          <p className="ofa-muted">
            Selected by developer config (OFA_ENGINE). Never switched silently.
          </p>
        </article>

        <article className="ofa-card" aria-label="Voice and keys">
          <h2>Voice and keys</h2>
          <dl className="ofa-dl">
            {Object.entries(status?.voice.stt_routes ?? {}).map(([k, v]) => (
              <div key={k} className="ofa-dl-row">
                <dt>STT {k}</dt>
                <dd>{v.join(" → ")}</dd>
              </div>
            ))}
            {Object.entries(status?.keys ?? {}).map(([k, v]) => (
              <div key={k} className="ofa-dl-row">
                <dt>{k}</dt>
                <dd>{v ? "set" : "missing"}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="ofa-card" aria-label="Vault">
          <h2>Vault</h2>
          <p>
            {status?.vault.unlocked ? "Unlocked" : "Locked"} ·{" "}
            {status?.vault.items ?? 0} handles
          </p>
          <a
            className="ofa-btn ghost"
            href={`${base}/vault#token=${encodeURIComponent(conn.token)}`}
            target="_blank"
            rel="noreferrer"
          >
            Open vault (local page)
          </a>
          <p className="ofa-muted">
            Secrets are entered only on the local vault page, never here or by
            voice.
          </p>
        </article>

        <article className="ofa-card ofa-wide" aria-label="Type a request">
          <h2>Type a request</h2>
          <form
            className="ofa-row"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              aria-label="Request"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. open Notepad"
              maxLength={2000}
            />
            <button
              className="ofa-btn"
              disabled={busy || !connected}
              type="submit"
            >
              {busy ? "Working…" : "Send"}
            </button>
          </form>
          {reply ? <p className="ofa-caption">{reply}</p> : null}
        </article>

        <article className="ofa-card ofa-wide" aria-label="Activity">
          <h2>Activity</h2>
          <ol className="ofa-log">
            {(status?.events ?? [])
              .slice()
              .reverse()
              .slice(0, 25)
              .map((e, i) => (
                <li key={`${e.ts}-${i}`}>
                  <time>{new Date(e.ts * 1000).toLocaleTimeString()}</time>{" "}
                  <b>{e.kind}</b> {String(e.text ?? e.spoken ?? e.status ?? "")}
                </li>
              ))}
          </ol>
        </article>

        <article className="ofa-card" aria-label="Remembered">
          <h2>Remembered</h2>
          {memory && Object.keys(memory.mappings).length ? (
            <ul className="ofa-list">
              {Object.entries(memory.mappings).map(([k, v]) => (
                <li key={k}>
                  <span>
                    “{k}” → {v}
                  </span>
                  <button
                    type="button"
                    className="ofa-btn ghost"
                    onClick={() => void forget(k)}
                  >
                    Forget
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ofa-muted">Nothing remembered.</p>
          )}
        </article>

        <article className="ofa-card" aria-label="Audit">
          <h2>Audit (local, redacted)</h2>
          <ol className="ofa-log">
            {audit.map((a, i) => (
              <li key={`${a.ts}-${i}`}>
                <time>{new Date(a.ts * 1000).toLocaleTimeString()}</time>{" "}
                {a.kind} {a.tier !== undefined ? `T${a.tier}` : ""}{" "}
                {a.result ?? ""} {a.detail ?? ""}
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
