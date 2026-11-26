"use client";
import { Button } from "@/components/ui/button";
import { useDesktop } from "./desktop-provider";

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
  } = useDesktop();
  const download = process.env.NEXT_PUBLIC_OFA_COMPANION_DOWNLOAD_URL;
  return (
    <section className="panel mt-6" aria-label="Desktop Integration">
      <div className="section-heading">
        <h2>Desktop Integration</h2>
        <span>Windows · Local development</span>
      </div>
      {!!state.choices?.length && (
        <div
          className="mt-4"
          role="region"
          aria-label="Choose installed application"
        >
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
      {state.connected && state.filePreview !== undefined && (
        <details className="mt-4">
          <summary>Latest selected file text</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap">
            {state.filePreview}
          </pre>
          <p>
            Preview is limited to 16,384 characters. Spoken reading is limited
            to the first 1,000 characters.
          </p>
        </details>
      )}
      {state.connected && (
        <>
          <div className="button-row mt-4">
            <Button variant="outline" onClick={refresh}>
              Refresh applications
            </Button>
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
          </div>
          <p className="mt-3">
            Read folders: {state.scopes?.read_roots?.join(", ") || "None"}.
            Write folders: {state.scopes?.write_roots?.join(", ") || "None"}.
          </p>
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
          <details className="mt-3">
            <summary>Startup preference</summary>
            <p>
              Starting OFA at Windows sign-in is optional. It still waits for a
              paired connection and a physical Caps Lock press before recording.
            </p>
            <div className="button-row mt-2">
              <Button variant="outline" onClick={() => scope("startup_on")}>
                Enable startup
              </Button>
              <Button variant="outline" onClick={() => scope("startup_off")}>
                Disable startup
              </Button>
            </div>
          </details>
          <p className="mt-3">
            Slack file sending:{" "}
            {state.scopes?.slack_configured
              ? "Locally configured; each send needs approval"
              : "Not configured; live Slack testing deferred"}
            .
          </p>
        </>
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
        <div
          className="mt-4"
          role="region"
          aria-label="Desktop human assistance"
        >
          <p>{state.task.handoff.reason}</p>
          <p>
            Finish this step in the application, then continue. OFA will check
            the result again.
          </p>
          <Button onClick={continueTask}>I finished; check again</Button>
        </div>
      )}
      <p>
        Connect once to open installed apps from any website. Press Caps Lock to
        start or stop listening.
      </p>
      <dl className="mt-4 grid gap-2">
        <div>
          <dt className="inline font-semibold">Computer: </dt>
          <dd className="inline" role="status">
            {state.status}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Microphone: </dt>
          <dd className="inline">
            {state.connected
              ? state.voiceState && state.voiceState !== "IDLE"
                ? state.voiceState.toLowerCase()
                : "Idle · press Caps Lock"
              : "Not enabled"}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Application access: </dt>
          <dd className="inline">
            {state.connected
              ? `${state.apps.length} installed applications indexed`
              : "Disabled"}
          </dd>
        </div>
      </dl>
      <div className="button-row mt-4">
        <Button
          disabled={
            state.connected ||
            state.status === "Approve on Windows" ||
            state.status === "Connecting"
          }
          onClick={() => run("connect")}
        >
          {state.connected ? "Computer connected" : "Connect computer"}
        </Button>
        <Button
          variant="outline"
          disabled={!state.connected}
          onClick={() => run("stop")}
        >
          Stop voice
        </Button>
        <Button variant="outline" onClick={() => run("disconnect")}>
          Disconnect computer
        </Button>
        <Button
          variant="outline"
          disabled={!state.connected}
          onClick={() => run("quit")}
        >
          Quit companion
        </Button>
        {download && (
          <a href={download} className="underline">
            Install Desktop Companion
          </a>
        )}
      </div>
      <p className="mt-3" aria-live="polite">
        {state.text}
      </p>
      {state.fingerprint && !state.connected && (
        <p>
          Browser key: <code>{state.fingerprint}</code>
        </p>
      )}
      <details className="mt-4">
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
          in Windows Privacy settings, then retry.
        </p>
        <p className="mt-2">
          Stopping voice keeps pairing. Disconnect revokes it. Browser
          microphone permission is only needed for browser capture; this mode
          uses the native microphone.
        </p>
      </details>
      <p className="muted small mt-4">
        Companion 0.2.2 · Basic commands use no LLM. Account sign-in and OFA
        Engine integration are pending.
      </p>
    </section>
  );
}
