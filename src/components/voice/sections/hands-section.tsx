"use client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDesktop } from "../desktop-provider";

/** Settings → Hands: what OFA may control, and what always needs your spoken yes. */
export function HandsSection() {
  const { state, scope, refresh, saveOfa } = useDesktop();
  const connected = state.connected;
  const hands = state.ofa?.settings.hands;
  return (
    <section className="panel mt-6" aria-label="Hands">
      <div className="section-heading">
        <h2>Hands</h2>
        <span>
          {connected ? "What OFA may control" : "Connect the computer first"}
        </span>
      </div>
      {hands && (
        <>
          <h3 className="mt-4">Control</h3>
          <div className="mt-2 grid gap-3">
            <label className="flex items-center gap-3">
              <Switch
                checked={hands.system_controls}
                onCheckedChange={(checked) =>
                  saveOfa({ hands: { system_controls: checked } })
                }
              />
              <span>
                System controls: volume, media, brightness, lock, clipboard,
                screenshots and quick settings
              </span>
            </label>
            <label className="flex items-center gap-3">
              <Switch
                checked={hands.answer_calls}
                onCheckedChange={(checked) =>
                  saveOfa({ hands: { answer_calls: checked } })
                }
              />
              <span>
                Answer calls: when you say “pick it up”, OFA presses Accept on
                the call that just appeared without asking again
              </span>
            </label>
          </div>
        </>
      )}
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
            Read folders: {state.scopes?.read_roots?.join(", ") || "None"}.
            Write folders: {state.scopes?.write_roots?.join(", ") || "None"}.
            Each button opens a native Windows confirmation; websites cannot
            choose paths or apps directly.
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
      {state.ofa && (
        <>
          <h3 className="mt-6">Always asks for your spoken yes</h3>
          <ul className="mt-2 list-disc pl-6">
            {state.ofa.always_ask.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2">
            Typed text can never approve these. Only your voice can, after OFA
            reads the exact action aloud.
          </p>
        </>
      )}
    </section>
  );
}
