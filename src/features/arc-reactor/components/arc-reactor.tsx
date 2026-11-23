"use client";
import { useState } from "react";
import { Check, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notice, PageTitle, Pill } from "@/components/common";
import { useApp } from "@/app/providers/app-provider";
import { ReactorVisual } from "@/components/reactor/reactor-visual";
import {
  reactorActionLabel,
  reactorIsTransitioning,
} from "@/lib/reactor/reactor-transition";

const taskRules = [
  {
    id: "code",
    label: "Code reasoning",
    hint: "Understanding, writing and explaining code",
  },
  {
    id: "refactor",
    label: "Refactoring",
    hint: "Restructuring code without changing behaviour",
  },
  {
    id: "deep",
    label: "High-reasoning tasks",
    hint: "Multi-step problems that need deeper capability",
  },
  {
    id: "planning",
    label: "Normal task planning",
    hint: "Everyday plans and routine steps",
  },
] as const;

type TaskRuleId = (typeof taskRules)[number]["id"];

/** The OFA Engine section: a local preview of "bring your own brain".
 * Activating it is the only behaviour here for now — how a
 * real model or API gets connected is still backend work. */
export function ArcReactor() {
  const { arcReactorActive, reactor, toggleArcReactor, notify } = useApp();
  const transitioning = reactorIsTransitioning(reactor.phase);
  const actionLabel = reactorActionLabel[reactor.phase];
  const status = {
    idle: [
      "OFA Engine dormant",
      "Activate the engine to enable complex requests",
      "Inactive",
    ],
    activating: [
      "OFA Engine initializing",
      "Bringing the engine online",
      "Initializing",
    ],
    active: [
      "OFA Engine active",
      "Ready for complex, multi-step requests",
      "Active",
    ],
    deactivating: [
      "OFA Engine powering down",
      "The heartbeat is paused; returning the engine to rest",
      "Powering down",
    ],
  }[reactor.phase];
  const [infoOpen, setInfoOpen] = useState(false);
  const [proUnlocked, setProUnlocked] = useState(false);
  // Engine R1 takes code and deep reasoning; the second engine takes planning.
  const [routing, setRouting] = useState<Record<TaskRuleId, string>>({
    code: "r1",
    refactor: "r1",
    deep: "r1",
    planning: "r2",
  });

  return (
    <>
      <PageTitle
        title="OFA Engine"
        description="Switch on a stronger brain for the hard, multi-step tasks."
      />
      <div className="panel-grid reactor-duo">
        <section
          className="panel reactor-panel"
          data-reactor-state={reactor.phase}
        >
          <Pill>Step 4 of 5 · local preview</Pill>
          <h2>Bring your own OFA Engine for hard tasks.</h2>
          <p>
            The built-in agent handles everyday requests. For a tough,
            multi-step challenge you can activate your own OFA Engine — a model
            or API the orchestrator can call on. When it is active, the
            orchestrator wakes up and takes the hard ones.
          </p>

          <button
            type="button"
            className={cn("reactor-stage", arcReactorActive && "is-live")}
            data-reactor-state={reactor.phase}
            aria-label={actionLabel}
            aria-pressed={arcReactorActive}
            aria-busy={transitioning}
            disabled={transitioning}
            onClick={toggleArcReactor}
          >
            <ReactorVisual reactor={reactor} />
          </button>

          <div
            className={cn("orchestrator-status", arcReactorActive && "active")}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="orchestrator-dot" aria-hidden="true" />
            <div>
              <strong>{status[0]}</strong>
              <small>{status[1]}</small>
            </div>
            <Pill tone={arcReactorActive ? "success" : "warning"}>
              {status[2]}
            </Pill>
          </div>

          <div className="orchestrator-example">
            <strong>Example of a tough request</strong>
            <p>
              “Compare three pricing providers, draft a note for #engineering
              with the result, and ask me before anything is sent.”
            </p>
            <small>
              Today the preview answers with a local plan. With an OFA Engine
              active, this is the kind of request it would break down and drive.
            </small>
          </div>

          <Notice tone="warning">
            This preview illustrates the engine state. Connecting a model, API
            or local bridge still needs backend work. No key, account or request
            is sent.
          </Notice>

          <div className="button-row">
            <Button
              variant="outline"
              onClick={() => setInfoOpen((v) => !v)}
              aria-expanded={infoOpen}
            >
              <Sparkles size={16} />
              OFA Engine details
            </Button>
            <Button
              className="reactor-action"
              disabled={transitioning}
              aria-busy={transitioning}
              aria-pressed={arcReactorActive}
              onClick={toggleArcReactor}
            >
              {arcReactorActive ? (
                <Check size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              {actionLabel}
            </Button>
          </div>
          {infoOpen && (
            <Notice>
              Open question: OAuth, an API key, or a local bridge? The logic is
              not defined yet. This section reserves the UI only; it is not
              wired to any provider.
            </Notice>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Bring your second OFA Engine.</h2>
            <Pill tone={proUnlocked ? "success" : "warning"}>
              {proUnlocked ? "Unlocked" : "GO PRO"}
            </Pill>
          </div>
          <p>
            Add a second engine beside the first, then choose which one takes
            each kind of work.
          </p>

          {!proUnlocked ? (
            <div className="empty-state">
              <Lock size={28} aria-hidden="true" />
              <h3>Locked · GO PRO</h3>
              <p>
                Here you can customise your OFA Engine settings for your task
                dependency: use OFA Engine R1 for code reasoning, refactoring or
                high-reasoning capability, and use this second engine for normal
                task planning.
              </p>
              <Button
                onClick={() => {
                  setProUnlocked(true);
                  notify(
                    "GO PRO unlocked in this preview. No payment or account was created.",
                  );
                }}
              >
                <Sparkles size={16} />
                GO PRO (preview)
              </Button>
              <p className="small muted">
                Preview only — no payment, account or backend is involved.
              </p>
            </div>
          ) : (
            <>
              <Notice>
                Second engine unlocked in this preview. Routing choices are
                local and reset on reload.
              </Notice>
              <div className="reactor-routing mt-6">
                {taskRules.map((rule) => (
                  <div className="list-row" key={rule.id}>
                    <div>
                      <strong>{rule.label}</strong>
                      <small className="small muted">{rule.hint}</small>
                    </div>
                    <div className="field">
                      <label
                        className="sr-only"
                        htmlFor={`reactor-route-${rule.id}`}
                      >
                        Engine for {rule.label}
                      </label>
                      <select
                        id={`reactor-route-${rule.id}`}
                        className="w-full"
                        value={routing[rule.id]}
                        onChange={(e) =>
                          setRouting((current) => ({
                            ...current,
                            [rule.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="r1">
                          OFA Engine R1 · code & deep reasoning
                        </option>
                        <option value="r2">OFA Engine R2 · planning</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="button-row">
                <Button variant="outline" onClick={() => setProUnlocked(false)}>
                  Lock again
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
