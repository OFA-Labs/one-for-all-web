"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  Copy,
  Keyboard,
  Mic,
  Minus,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import {
  type MockScenario,
  type TargetCondition,
} from "@/lib/dictation/contracts";
import { useDictation } from "./dictation-provider";
import { dictationStatus } from "./dictation-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationButton, PageTitle, Pill } from "@/components/common";

const previewApps = [
  { name: "Notepad", id: "notepad" },
  { name: "Code editor", id: "code-editor" },
  { name: "Chat", id: "chat" },
] as const;

function subscribeToPageFocus(onChange: () => void) {
  window.addEventListener("focus", onChange);
  window.addEventListener("blur", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    window.removeEventListener("blur", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}
const pageHasFocus = () =>
  document.visibilityState !== "hidden" && document.hasFocus();
const serverHasFocus = () => false;

function DictationPreferences() {
  const api = useDictation();
  const { state, send, shortcut } = api;
  const focused = useSyncExternalStore(
    subscribeToPageFocus,
    pageHasFocus,
    serverHasFocus,
  );
  const busy = !["IDLE", "ERROR"].includes(state.phase);
  const shortcutMessage = !state.enabled
    ? "Shortcut off. Enable the preview above."
    : state.connection !== "ready"
      ? "Waiting for keyboard preview availability."
      : !focused
        ? "Page unfocused. Click inside this page, then press Caps Lock."
        : shortcut.outcome === "modified"
          ? "Release Shift, Ctrl, Alt and Windows, then press Caps Lock alone."
          : shortcut.outcome === "untrusted"
            ? "Forwarded Caps Lock event blocked. Use the physical key, or allow injected shortcut keys in Desktop preferences for this preview."
            : shortcut.presses
              ? `Caps Lock detected · ${shortcut.presses} ${shortcut.presses === 1 ? "press" : "presses"}.`
              : "Shortcut ready. Press Caps Lock while this page is focused.";
  return (
    <fieldset
      className="dictation-preferences panel"
      disabled={!state.hydrated}
      aria-label="Dictation preferences"
    >
      <div className="dictation-enable-row">
        <div>
          <h2>Caps Lock dictation</h2>
          <p>One press to begin. One press to finish.</p>
        </div>
        <Pill>{dictationStatus(api)} · demo</Pill>
        <Switch
          aria-label="Enable dictation preview"
          checked={state.enabled}
          disabled={!state.hydrated}
          onCheckedChange={(enabled) =>
            enabled ? api.requestEnable() : api.disable()
          }
        />
      </div>
      <p className="dictation-scope-note">
        Preview only: keyboard handling stays in this website. No microphone is
        opened and no external app is changed.
      </p>
      <p
        className="dictation-shortcut-status"
        role="status"
        aria-live="polite"
        data-testid="dictation-shortcut-status"
      >
        <Keyboard size={16} aria-hidden="true" />
        <span>{shortcutMessage}</span>
      </p>
      <p className="dictation-shortcut-help">
        Click the page first. The address bar, DevTools and other windows
        receive their own keyboard input. This browser preview cannot listen
        there.
      </p>
      {state.connection === "connecting" && (
        <p role="status" className="dictation-inline-status">
          Preparing keyboard preview…
        </p>
      )}
      {state.connection === "error" && (
        <div className="dictation-inline-error">
          <p role="alert">{state.connectionReason}</p>
          <Button
            variant="outline"
            onClick={() => send({ type: "RECONNECT", now: Date.now() })}
          >
            Retry availability
          </Button>
        </div>
      )}
      <div className="dictation-preference-grid">
        <label>
          Shortcut
          <Input value="Caps Lock" readOnly aria-label="Dictation shortcut" />
        </label>
        <label>
          Insert into
          <select
            aria-label="Insertion target policy"
            value={state.settings.insertionTargetPolicy}
            disabled={busy}
            onChange={(event) =>
              send({
                type: "SETTINGS",
                patch: {
                  insertionTargetPolicy:
                    event.target.value === "current" ? "current" : "original",
                },
                now: Date.now(),
              })
            }
          >
            <option value="original">Original app</option>
            <option value="current">Current app</option>
          </select>
        </label>
        <label>
          Session limit (minutes)
          <Input
            aria-label="Recording limit in minutes"
            type="number"
            min={1}
            max={240}
            value={state.settings.maxRecordingMinutes}
            onChange={(event) =>
              send({
                type: "SETTINGS",
                patch: { maxRecordingMinutes: Number(event.target.value) },
                now: Date.now(),
              })
            }
          />
        </label>
        <label>
          Keep failed previews (hours)
          <Input
            aria-label="Failed session retention hours"
            type="number"
            min={1}
            max={168}
            value={state.settings.retainFailedAudioHours}
            onChange={(event) =>
              send({
                type: "SETTINGS",
                patch: { retainFailedAudioHours: Number(event.target.value) },
                now: Date.now(),
              })
            }
          />
        </label>
      </div>
      <details className="dictation-advanced">
        <summary>Desktop preferences</summary>
        <p>
          Saved for a future desktop adapter. Native injected-key detection,
          sounds, and close-to-tray are not implemented.
        </p>
        {(
          [
            ["acceptInjectedKeys", "Accept injected shortcut keys"],
            ["soundCues", "Start and stop sound cues"],
            ["closeToTray", "Close to tray while enabled"],
          ] as const
        ).map(([key, label]) => (
          <div className="dictation-toggle-row" key={key}>
            <label htmlFor={`dictation-${key}`}>{label}</label>
            <Switch
              id={`dictation-${key}`}
              checked={state.settings[key]}
              onCheckedChange={(value) =>
                send({
                  type: "SETTINGS",
                  patch: { [key]: value },
                  now: Date.now(),
                })
              }
            />
          </div>
        ))}
        <IntegrationButton
          id="dictation.preview"
          label="Dictation frontend handoff"
        />
      </details>
      <p className="dictation-small-note">
        Preferences and demo recovery data stay in this tab’s session storage.
        The preview starts off again after reload.
      </p>
    </fieldset>
  );
}

export function DictationWorkspace({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const api = useDictation();
  const { state, send } = api;
  const foregroundTab = previewApps.find(
    (app) => app.name === state.foreground,
  )!.id;
  const ready = state.enabled && state.connection === "ready";
  const capturing = state.phase === "STARTING" || state.phase === "LISTENING";
  const busy = state.phase === "PROCESSING" || state.phase === "INSERTING";
  const recoveryBusy = capturing || busy;
  const fallback = state.recent.find(
    (entry) => entry.status === "needs-copy" && entry.transcript,
  );
  return (
    <fieldset
      className="dictation-workspace"
      disabled={!state.hydrated}
      aria-label="Dictation preview workspace"
    >
      {!embedded && (
        <PageTitle
          title="Speak. Then carry on."
          description="A Caps Lock dictation preview for O F A. Try the complete flow here before a desktop host is connected."
          action={
            <span className="dictation-demo-label">Frontend simulation</span>
          }
        />
      )}
      <DictationPreferences />
      {state.notice && (
        <div className="dictation-notice" role="status">
          <span>{state.notice}</span>
          <button
            className="icon-button"
            aria-label="Dismiss dictation notice"
            onClick={() => send({ type: "NOTICE", text: "", now: Date.now() })}
          >
            ×
          </button>
        </div>
      )}
      <div className="dictation-workspace-grid">
        <section
          className="dictation-sandbox panel"
          aria-label="Dictation target preview"
        >
          <div className="section-heading">
            <div>
              <h2>Your preview workspace</h2>
              <p>
                Choose a mock app, put your cursor in its text, then press{" "}
                <kbd>Caps Lock</kbd>.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                state.minimized
                  ? "Restore preview window"
                  : "Minimize preview window"
              }
              onClick={() =>
                send({
                  type: "MINIMIZE",
                  minimized: !state.minimized,
                  now: Date.now(),
                })
              }
            >
              <Minus size={16} />
            </Button>
          </div>
          <Tabs
            value={foregroundTab}
            onValueChange={(value) => {
              const app = previewApps.find((item) => item.id === value);
              if (!app) return;
              send({
                type: "FOREGROUND",
                app: app.name,
                now: Date.now(),
              });
            }}
          >
            <TabsList aria-label="Simulated foreground app">
              {previewApps.map((app) => (
                <TabsTrigger key={app.id} value={app.id}>
                  {app.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={foregroundTab}>
              {state.minimized ? (
                <div className="dictation-minimized">
                  <Keyboard size={25} />
                  <h3>Preview window minimized</h3>
                  <p>
                    An active session keeps listening. This simulates a window
                    change inside the site.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      send({
                        type: "MINIMIZE",
                        minimized: false,
                        now: Date.now(),
                      })
                    }
                  >
                    Restore preview
                  </Button>
                </div>
              ) : (
                <div className="dictation-target-window">
                  <div className="dictation-target-bar">
                    <span className="dictation-target-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>{state.foreground} · simulated target</span>
                  </div>
                  <label className="sr-only" htmlFor="dictation-target-text">
                    {state.foreground} preview text
                  </label>
                  <Textarea
                    id="dictation-target-text"
                    spellCheck={false}
                    value={state.documents[state.foreground]}
                    onChange={(event) =>
                      send({
                        type: "DOCUMENT",
                        app: state.foreground,
                        text: event.target.value,
                        now: Date.now(),
                      })
                    }
                    placeholder="Text appears here in the preview. No external application is connected."
                  />
                  <div className="dictation-target-footer">
                    <span>
                      {state.session
                        ? `Original target: ${state.session.target.app}`
                        : `Target: ${state.foreground}`}
                    </span>
                    <span>
                      {state.foreground === "Chat"
                        ? "No Enter/send action is simulated"
                        : "In-app preview only"}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <div className="dictation-preview-actions">
            <Button disabled={!ready || busy} onClick={api.toggle}>
              {capturing ? <Square size={14} /> : <Mic size={16} />}
              {capturing ? "Stop preview" : "Start preview"}
            </Button>
            <span>
              <kbd>Caps Lock</kbd> toggles · release and silence keep listening
            </span>
          </div>
        </section>
        <section
          className="dictation-simulation panel"
          aria-label="Dictation simulation controls"
        >
          <div className="section-heading">
            <h2>Preview scenarios</h2>
            <Pill>Simulated</Pill>
          </div>
          <label className="dictation-field">
            Speech result
            <Textarea
              aria-label="Simulated transcript"
              maxLength={20000}
              value={state.sample}
              onChange={(event) =>
                send({
                  type: "SAMPLE",
                  text: event.target.value,
                  now: Date.now(),
                })
              }
            />
          </label>
          <p className="dictation-small-note">
            This text stands in for an STT result. Unicode, emoji, code and line
            breaks stay intact.
          </p>
          <label className="dictation-field">
            Service scenario
            <select
              aria-label="Dictation service scenario"
              value={state.scenario}
              onChange={(event) =>
                send({
                  type: "SCENARIO",
                  scenario: event.target.value as MockScenario,
                  now: Date.now(),
                })
              }
            >
              <option value="success">Successful preview</option>
              <option value="mic-denied">Microphone unavailable</option>
              <option value="retry-once">Connection recovers on retry</option>
              <option value="network-error">
                Connection fails after retries
              </option>
              <option value="empty">No speech detected</option>
              <option value="long-session">Multipart transcription</option>
              <option value="hook-failure">Keyboard preview unavailable</option>
            </select>
          </label>
          <p className="dictation-small-note">
            Applies to the next session or retry. To preview keyboard setup
            failure, disable and enable the preview again.
          </p>
          <label className="dictation-field">
            Target condition
            <select
              aria-label="Dictation target condition"
              value={state.targetCondition}
              onChange={(event) =>
                send({
                  type: "TARGET_CONDITION",
                  condition: event.target.value as TargetCondition,
                  now: Date.now(),
                })
              }
            >
              <option value="normal">Normal text field</option>
              <option value="password">Password field (refuse start)</option>
              <option value="closed">Window closed before insertion</option>
              <option value="elevated">Elevated / blocked window</option>
              <option value="overlay">Indicator itself (refuse start)</option>
            </select>
          </label>
          <details className="dictation-advanced">
            <summary>Interruption controls</summary>
            <div className="dictation-failure-actions">
              <Button
                variant="outline"
                disabled={state.phase !== "LISTENING"}
                onClick={() =>
                  send({ type: "STOP", reason: "cap", now: Date.now() })
                }
              >
                Reach session limit
              </Button>
              <Button
                variant="outline"
                disabled={state.phase !== "LISTENING"}
                onClick={() =>
                  send({ type: "STOP", reason: "device-lost", now: Date.now() })
                }
              >
                Disconnect device
              </Button>
              <Button
                variant="outline"
                disabled={!state.session}
                onClick={() =>
                  send({
                    type: "INTERRUPT",
                    reason: "Simulated lock / sleep interruption",
                    now: Date.now(),
                  })
                }
              >
                Lock / sleep preview
              </Button>
            </div>
          </details>
        </section>
      </div>
      {fallback && (
        <section className="panel dictation-preview-clipboard">
          <div className="section-heading">
            <h2>Preview clipboard</h2>
            <Button
              variant="outline"
              onClick={() => void api.copyText(fallback.transcript!)}
            >
              <Copy size={14} />
              Copy text
            </Button>
          </div>
          <p>
            Automatic fallback only prepares this preview. Your real clipboard
            is changed only if you click Copy text.
          </p>
          <Textarea
            aria-label="Preview clipboard text"
            readOnly
            value={fallback.transcript}
          />
        </section>
      )}
      <section className="panel dictation-recent" id="recent-dictations">
        <div className="section-heading">
          <div>
            <h2>Recent dictations</h2>
            <p>
              Unfinished previews stay here until insertion is confirmed in the
              sandbox, you discard them, or their retention period expires.
            </p>
          </div>
          <Pill>{state.recent.length} kept</Pill>
        </div>
        {!state.recent.length ? (
          <div className="dictation-recent-empty">
            <RotateCcw size={21} />
            <p>No unfinished previews.</p>
            <span>
              Failed or interrupted sessions will be kept here. No audio files
              are recorded.
            </span>
          </div>
        ) : (
          <div className="dictation-recent-list">
            {state.recent.map((entry) => (
              <article key={entry.id}>
                <div className="dictation-recent-title">
                  <strong>{entry.target.app} preview</strong>
                  <Pill>
                    {entry.status === "needs-copy"
                      ? "Copy available"
                      : entry.status === "failed"
                        ? "Needs retry"
                        : "Saved"}
                  </Pill>
                </div>
                <p>{entry.reason}</p>
                {entry.transcript && <pre>{entry.transcript}</pre>}
                <span className="dictation-small-note">
                  Mock recovery data · expires{" "}
                  {new Intl.DateTimeFormat("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(entry.expiresAt)}{" "}
                  IST
                </span>
                <div className="button-row">
                  {entry.transcript && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void api.copyText(entry.transcript!)}
                    >
                      <Copy size={13} />
                      Copy text
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!ready || recoveryBusy}
                    onClick={() => api.retry(entry.id)}
                  >
                    <Play size={13} />
                    Retry preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      send({
                        type: "DISCARD",
                        recentId: entry.id,
                        now: Date.now(),
                      })
                    }
                  >
                    <Trash2 size={13} />
                    Discard
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <details className="dictation-diagnostics">
        <summary>Frontend handoff and state history</summary>
        <p>
          Backend not implemented: native hook, desktop overlay, real
          capture/STT, external insertion, native clipboard safety, tray
          lifecycle and operating-system kill switches.{" "}
          <Link href="/handoff">Open developer handoff</Link>.
        </p>
        <p>
          Transitions below contain metadata only; no keystrokes or transcript
          text.
        </p>
        <pre aria-label="Dictation transition metadata">
          {state.transitions
            .map((transition) => JSON.stringify(transition))
            .join("\n") || "No session transitions yet."}
        </pre>
      </details>
    </fieldset>
  );
}
