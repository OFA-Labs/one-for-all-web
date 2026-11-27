"use client";
import { Button } from "@/components/ui/button";
import { useDesktop } from "../desktop-provider";

/** Settings → Connection: companion status, pairing, and stopping or quitting the companion. */
export function ConnectionSection() {
  const { state, run } = useDesktop();
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
        <Button
          variant="outline"
          disabled={!connected}
          onClick={() => run("stop")}
        >
          Stop voice
        </Button>
        <Button variant="outline" onClick={() => run("disconnect")}>
          Disconnect computer
        </Button>
        <Button
          variant="outline"
          disabled={!connected}
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
      {state.fingerprint && !connected && (
        <p className="mt-2">
          Browser key: <code>{state.fingerprint}</code>
        </p>
      )}
      <p className="mt-2">
        Press Caps Lock on this computer to start or stop listening. Pairing is
        required once; voice commands work from any allowed website.
      </p>

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
