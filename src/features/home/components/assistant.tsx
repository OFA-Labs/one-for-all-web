"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ChevronRight,
  GitPullRequest,
  Headphones,
  Search,
  Send,
} from "lucide-react";
import { useApp } from "@/app/providers/app-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  classifyPreview,
  historyRows,
  interruptionPreview,
  orbStates,
  scenarios,
  type OrbState,
} from "@/lib/demo";
import { IntegrationButton, Pill, SectionLink } from "@/components/common";
import {
  Plan,
  TaskLink,
  TaskReview,
  Timeline,
} from "@/components/tasks/task-workspace";
export function Assistant({
  orb,
  onOrbChange: setOrb,
  onInterrupt,
}: {
  orb: OrbState | null;
  onOrbChange: (state: OrbState | null) => void;
  onInterrupt: () => void;
}) {
  const { task, act, start, integrate, notify } = useApp();
  const [queued, setQueued] = useState<string[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const submit = (value: string) => {
    if (!value.trim()) return;
    const command = interruptionPreview(value);
    if (command === "pause" || command === "cancel") onInterrupt();
    if (task && command !== "none") {
      act({ type: command });
      return;
    }
    if (task && !["completed", "cancelled", "declined"].includes(task.status)) {
      setConflict(value);
      return;
    }
    integrate(scenarios[classifyPreview(value)].feature, () => {
      start(classifyPreview(value), value);
      setOrb(null);
    });
  };
  return (
    <>
      <section className="ofa-assistant" aria-label="Ask and act">
        {task ? (
          <div className="active-task-grid">
            <div className="active-task-heading">
              <h2>{scenarios[task.scenario].name}</h2>
              <TaskLink task={task} />
            </div>
            <div>
              <TaskReview task={task} />
            </div>
            <div>
              <Plan task={task} />
              <Timeline task={task} />
            </div>
          </div>
        ) : (
          <>
            <section className="starter-section">
              <div className="section-heading">
                <h2>A few things we can try</h2>
                <Link href="/playground" className="text-button">
                  Explore the Playground
                  <ArrowRight size={15} />
                </Link>
              </div>
              <div className="starter-grid">
                {(
                  [
                    {
                      id: "pr",
                      icon: GitPullRequest,
                      label: "Nudge a pull request",
                      detail: "A thoughtful note, ready for your review.",
                    },
                    {
                      id: "jobs",
                      icon: Search,
                      label: "Find your next role",
                      detail: "Your preferences. A shortlist that fits.",
                    },
                    {
                      id: "social",
                      icon: Send,
                      label: "Share your work",
                      detail: "Four drafts. One place to review them.",
                    },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    className="starter-prompt"
                    onClick={() => submit(scenarios[s.id].prompt)}
                  >
                    <span className="starter-icon">
                      <s.icon size={20} />
                    </span>
                    <strong>{s.label}</strong>
                    <p>{s.detail}</p>
                    <ArrowUp className="starter-arrow" size={16} />
                  </button>
                ))}
              </div>
            </section>
            <section className="recent-section">
              <div className="section-heading">
                <h2>A sense of what’s possible</h2>
                <SectionLink href="/history">Sample history</SectionLink>
              </div>
              <div className="recent-rows">
                {historyRows.slice(0, 3).map((r, i) => (
                  <Link
                    href={`/tasks/${r.id}`}
                    key={r.id}
                    className="recent-row"
                  >
                    <span className="recent-icon">
                      {i === 0 ? (
                        <GitPullRequest size={18} />
                      ) : i === 1 ? (
                        <Search size={18} />
                      ) : (
                        <Headphones size={18} />
                      )}
                    </span>
                    <div>
                      <strong>{r.title}</strong>
                      <small>{r.subtitle}</small>
                    </div>
                    <Pill
                      tone={r.status === "Verified" ? "success" : "warning"}
                    >
                      {r.status} · sample
                    </Pill>
                    <span className="recent-date">{r.date}</span>
                    <ChevronRight size={15} />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
        <details className="state-lab">
          <summary>
            Explore voice states <span>14 frontend previews</span>
          </summary>
          <label htmlFor="orb-state">Voice state</label>
          <select
            id="orb-state"
            value={orb || "auto"}
            onChange={(e) =>
              setOrb(
                e.target.value === "auto" ? null : (e.target.value as OrbState),
              )
            }
          >
            <option value="auto">Follow sample task</option>
            {orbStates.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <p className="small muted">
            Live product states must come from real device and server signals.
            These are isolated visual previews.
          </p>
          <IntegrationButton
            id="voice.session"
            label="Voice integration details"
          />
        </details>
        {queued.length > 0 && (
          <section className="panel">
            <h2>Queued previews ({queued.length}/3)</h2>
            {queued.map((q, i) => (
              <div className="list-row" key={`${q}-${i}`}>
                <span>{q}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !!task &&
                    !["completed", "cancelled", "declined"].includes(
                      task.status,
                    )
                  }
                  onClick={() => {
                    start(classifyPreview(q), q);
                    setQueued((xs) => xs.filter((_, n) => n !== i));
                  }}
                >
                  Run next preview
                </Button>
              </div>
            ))}
          </section>
        )}
        <Dialog
          open={!!conflict}
          onOpenChange={(open) => {
            if (!open) setConflict(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>One thing at a time, or in the queue?</DialogTitle>
              <DialogDescription>
                A sample task is already in front. You can add this request to
                its plan, queue up to three, or replace it.
              </DialogDescription>
            </DialogHeader>
            <div className="stack">
              <Button
                variant="outline"
                onClick={() => {
                  notify(
                    "Amendment preview: current task paused. A real plan change requires backend validation and a fresh plan version.",
                  );
                  act({ type: "pause" });
                  setConflict(null);
                  integrate("task.control");
                }}
              >
                Add as an amendment
              </Button>
              <Button
                disabled={queued.length >= 3}
                onClick={() => {
                  if (conflict) setQueued((q) => [...q, conflict]);
                  setConflict(null);
                }}
              >
                Queue this preview ({queued.length}/3)
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (conflict) start(classifyPreview(conflict), conflict);
                  setConflict(null);
                }}
              >
                Replace current preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </>
  );
}
