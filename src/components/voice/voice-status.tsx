"use client";
import { Button } from "@/components/ui/button";
import { useDesktop } from "./desktop-provider";
import type { CompanionHealth } from "@/lib/voice/local-development-client";

const languageLabels: Record<string, string> = {
  auto: "Auto-detect from speech",
  en: "English",
  hi: "Hindi",
  hinglish: "Hindi-English",
};

function SpeechStatus({ health }: { health?: CompanionHealth }) {
  const speech = health?.speech;
  if (!speech)
    return (
      <p className="mt-2">
        Start the desktop companion to read its live speech configuration.
      </p>
    );
  const providers = [
    `${speech.deepgram_configured ? "Deepgram configured" : "Deepgram not configured"}`,
    `${speech.gradium_configured ? "Gradium configured" : "Gradium not configured"}`,
  ].join(" · ");
  return (
    <dl className="mt-2 grid gap-2">
      <div>
        <dt className="inline font-semibold">Runtime: </dt>
        <dd className="inline">
          {speech.mode === "live"
            ? "Live provider speech"
            : "Fake speech (no provider calls)"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Language: </dt>
        <dd className="inline">
          {languageLabels[speech.language] ?? speech.language}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Speech-to-text order: </dt>
        <dd className="inline">{speech.stt_order.join(" → ")}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Text-to-speech order: </dt>
        <dd className="inline">{speech.tts_order.join(" → ")}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Keys on this computer: </dt>
        <dd className="inline">{providers}. Key values are never sent here.</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Microphone mode: </dt>
        <dd className="inline">
          {speech.headphones
            ? "Headphones · interruption enabled"
            : "Speaker · capture gated while replying"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Command policy: </dt>
        <dd className="inline">
          {speech.command_only ? "Deterministic commands only" : "Extended"}
        </dd>
      </div>
    </dl>
  );
}

export function VoiceStatus() {
  const {
    state,
    run,
    scope,
    refresh,
    decide,
    answer,
    continueTask,
    chooseApp,
    checkCompanion,
  } = useDesktop();
  const download = process.env.NEXT_PUBLIC_OFA_COMPANION_DOWNLOAD_URL;
  const connected = state.connected;
  const speech = state.health?.speech;

  return (
    <section className="panel mt-6" aria-label="Desktop Integration">
      <div className="section-heading">
        <h2>Desktop Integration</h2>
        <span>
          {state.health?.version
            ? `Companion ${state.health.version} · ${state.health.os ?? "Windows"}`
            : "Companion not running"}
        </span>
      </div>

      <dl className="mt-4 grid gap-2">
        <div>
          <dt className="inline font-semibold">Computer: </dt>
          <dd className="inline">
            <span role="status">{state.status}</span>
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Microphone: </dt>
          <dd className="inline">
            {connected
              ? state.voiceState && state.voiceState !== "IDLE"
                ? state.voiceState.toLowerCase()
                : "Idle · press Caps Lock"
              : "Not enabled"}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Application access: </dt>
          <dd className="inline">
            {connected
              ? `${state.apps.length} installed applications indexed`
              : "Disabled"}
          </dd>
        </div>
      </dl>
      <p className="mt-3" aria-live="polite">
        {state.text}
      </p>

      {state.status === "Approve on Windows" && (
        <div className="mt-4 rounded border p-4" role="status" aria-live="polite">
          <h3 className="font-semibold">Approve on Windows</h3>
          <p className="mt-1">
            A small permission card is open on your desktop. Check the website
            and browser key, then choose Connect.
          </p>
          {state.fingerprint && (
            <p className="mt-2">
              Browser key: <code>{state.fingerprint}</code>
            </p>
          )}
          <p className="muted small mt-2">
            Waiting for your confirmation. Nothing is recorded and no app is
            opened until you approve.
          </p>
        </div>
      )}

      {!!state.choices?.length && (
        <div className="mt-4" role="region" aria-label="Choose installed application">
          <p>Which installed application should I open?</p>
          <div className="button-row">
            {state.choices.map((option) => (
              <Button key={option.id} onClick={() => chooseApp(option.id)}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {state.task?.approval && (
        <div
          className="mt-4 rounded border p-4"
          role="region"
          aria-label="Desktop action approval"
        >
          <h3>Approve this exact action</h3>
          <p>{state.task.approval.exact_action.operation}</p>
          {state.task.approval.reading.identity?.workspace ? (
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(
                state.task.approval.reading.identity.workspace,
                null,
                2,
              )}
            </pre>
          ) : null}
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(state.task.approval.exact_action.target, null, 2)}
          </pre>
          {state.task.approval.exact_action.text !== undefined && (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">
              {state.task.approval.exact_action.text}
            </pre>
          )}
          <p>
            Current version: <code>{state.task.approval.reading_hash}</code>
          </p>
          {state.task.approval.reading.facts.sha256 ? (
            <p>
              File SHA-256:{" "}
              <code>{String(state.task.approval.reading.facts.sha256)}</code>
            </p>
          ) : null}
          <div className="button-row mt-3">
            <Button onClick={() => decide(true)}>Approve action</Button>
            <Button variant="outline" onClick={() => decide(false)}>
              Reject action
            </Button>
          </div>
          <p>
            Changed state or an expired approval requires a fresh card. Stop
            voice cancels pending work.
          </p>
        </div>
      )}
      {state.task?.question && (
        <div className="mt-4" role="region" aria-label="Desktop action choice">
          <p>{state.task.question.message}</p>
          <div className="button-row">
            {state.task.question.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                onClick={() => answer(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {state.task?.handoff && (
        <div className="mt-4" role="region" aria-label="Desktop human assistance">
          <p>{state.task.handoff.reason}</p>
          <p>
            Finish this step in the application, then continue. OFA will check
            the result again.
          </p>
          <Button onClick={continueTask}>I finished; check again</Button>
        </div>
      )}
      {connected && state.filePreview !== undefined && (
        <details className="mt-4">
          <summary>Latest selected file text</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap">
            {state.filePreview}
          </pre>
          <p>Showing the first 16,384 characters read by the companion.</p>
        </details>
      )}

      <h3 className="mt-6">Connection</h3>
      <div className="button-row mt-2">
        <Button
          disabled={
            connected ||
            state.status === "Approve on Windows" ||
            state.status === "Connecting"
          }
          onClick={() => run("connect")}
        >
          {connected ? "Computer connected" : "Connect computer"}
        </Button>
        <Button variant="outline" disabled={!connected} onClick={() => run("stop")}>
          Stop voice
        </Button>
        <Button variant="outline" onClick={() => run("disconnect")}>
          Disconnect computer
        </Button>
        <Button variant="outline" disabled={!connected} onClick={() => run("quit")}>
          Quit companion
        </Button>
        {download && (
          <a href={download} className="underline">
            Install Desktop Companion
          </a>
        )}
      </div>
      {state.fingerprint && !connected && (
        <p className="mt-2">
          Browser key: <code>{state.fingerprint}</code>
        </p>
      )}
      <p className="mt-2">
        Press Caps Lock on this computer to start or stop listening. Pairing is
        required once; voice commands work from any allowed website.
      </p>

      {connected && (
        <>
          <h3 className="mt-6">Permissions and folders</h3>
          <div className="button-row mt-2">
            <Button variant="outline" onClick={() => scope("register_app")}>
              Register installed app
            </Button>
            <Button
              variant="outline"
              disabled={state.scopes?.window_controls}
              onClick={() => scope("windows")}
            >
              {state.scopes?.window_controls
                ? "Window controls enabled"
                : "Enable window controls"}
            </Button>
            <Button variant="outline" onClick={() => scope("read_folder")}>
              Choose read folder
            </Button>
            <Button variant="outline" onClick={() => scope("write_folder")}>
              Choose write folder
            </Button>
            <Button variant="outline" onClick={() => scope("startup_on")}>
              Enable startup
            </Button>
            <Button variant="outline" onClick={() => scope("startup_off")}>
              Disable startup
            </Button>
          </div>
          <p className="mt-3">
            Read folders: {state.scopes?.read_roots?.join(", ") || "None"}. Write
            folders: {state.scopes?.write_roots?.join(", ") || "None"}. Each
            button opens a native Windows confirmation; websites cannot choose
            paths or apps directly.
          </p>

          <h3 className="mt-6">Applications</h3>
          <div className="button-row mt-2">
            <Button variant="outline" onClick={refresh}>
              Refresh applications
            </Button>
          </div>
          <details className="mt-3">
            <summary>Available application names ({state.apps.length})</summary>
            <ul className="mt-2 max-h-64 overflow-y-auto">
              {state.apps.map((app) => (
                <li key={app.id}>{app.name}</li>
              ))}
            </ul>
            <p>
              Use the full name shown above. Similar names require a choice;
              fuzzy matches only suggest.
            </p>
          </details>
        </>
      )}

      <div className="section-heading mt-6">
        <h3>Speech providers</h3>
        <Button variant="outline" onClick={checkCompanion}>
          Check companion status
        </Button>
      </div>
      <SpeechStatus health={state.health} />

      <h3 className="mt-6">Account and connected services</h3>
      <dl className="mt-2 grid gap-2">
        <div>
          <dt className="inline font-semibold">Sign-in: </dt>
          <dd className="inline">
            {state.health?.identity_mode === "local-development"
              ? "Local development pairing; no account is signed in"
              : "Not reported by companion"}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">OFA Engine reasoning: </dt>
          <dd className="inline">
            {speech?.engine_enabled
              ? "Connected"
              : "Not connected · deterministic commands only"}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Slack file sending: </dt>
          <dd className="inline">
            {state.scopes?.slack_configured
              ? "Configured on this computer; each send needs approval"
              : "Not configured on this computer"}
          </dd>
        </div>
      </dl>

      <details className="mt-6">
        <summary>Setup and troubleshooting</summary>
        <ol className="list-decimal pl-6 mt-2 space-y-2">
          <li>Start the Python desktop companion on this Windows computer.</li>
          <li>
            Click Connect computer. If your browser requests local connection
            access, allow it for this OFA website.
          </li>
          <li>
            Approve the Windows dialog after checking its website and browser
            key.
          </li>
          <li>
            Switch to another website, press Caps Lock and say “Open WhatsApp”.
            Press Caps Lock again to release the microphone.
          </li>
        </ol>
        <p className="mt-2">
          If microphone access fails, allow desktop apps to use your microphone
          in Windows Privacy settings, then retry. Stop keeps pairing;
          Disconnect revokes it and clears folder and window grants.
        </p>
      </details>
    </section>
  );
}
