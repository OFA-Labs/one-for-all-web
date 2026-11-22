"use client";
import { useState } from "react";
import { Bell, GitPullRequest, Plus, Trash2 } from "lucide-react";
import { useApp } from "./provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  EmptyState,
  IntegrationButton,
  Notice,
  PageTitle,
  Pill,
} from "./common";
export { HistoryCalendar as HistoryPage } from "./history-calendar";

type Watcher = {
  id: number;
  repo: string;
  pr: number;
  status: "Active" | "Paused" | "Merged" | "Expired" | "Failed" | "Closed";
  failures: number;
};
export function Watchers() {
  const { role, integrate, notify, addWatcherNotice } = useApp();
  const [items, setItems] = useState<Watcher[]>([
    { id: 1, repo: "acme/voice-kit", pr: 142, status: "Active", failures: 0 },
    { id: 2, repo: "acme/playground", pr: 38, status: "Active", failures: 0 },
  ]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [repo, setRepo] = useState("");
  const [pr, setPr] = useState("");
  const [error, setError] = useState("");
  const [remove, setRemove] = useState<number | null>(null);
  const update = (id: number, patch: Partial<Watcher>) =>
    setItems((xs) => xs.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !/^[\w.-]+\/[\w.-]+$/.test(repo) ||
      !Number.isInteger(Number(pr)) ||
      Number(pr) < 1
    ) {
      setError("Enter an owner/repository and a positive PR number.");
      return;
    }
    if (
      items.some(
        (w) => w.id !== editing && w.repo === repo && w.pr === Number(pr),
      )
    ) {
      setError(
        "You’re already watching this PR. The real backend reuses the existing watcher.",
      );
      return;
    }
    if (!editing && items.filter((w) => w.status === "Active").length >= 10) {
      setError("The limit is 10 active watchers.");
      return;
    }
    setOpen(false);
    integrate("watchers.manage", () => {
      if (editing) update(editing, { repo, pr: Number(pr) });
      else
        setItems((xs) => [
          ...xs,
          {
            id: Date.now(),
            repo,
            pr: Number(pr),
            status: "Active",
            failures: 0,
          },
        ]);
      notify(
        "Watcher saved in local preview. No checks or notifications are running.",
      );
    });
  };
  return (
    <>
      <PageTitle
        title="Keep an eye on it. Then let it go."
        description="Watch for a PR merge, even when your laptop is off. The samples here don’t run background checks."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setRepo("");
              setPr("");
              setError("");
              setOpen(true);
            }}
          >
            <Plus size={16} />
            New watcher
          </Button>
        }
      />
      {role === "visitor" && (
        <Notice>
          Watchers require a member account and GitHub connection. You can
          explore the local examples without either.
        </Notice>
      )}
      <div className="panel mt-6">
        <div className="section-heading">
          <h2>Your watchlist</h2>
          <Pill>
            {items.filter((w) => w.status === "Active").length} active samples /
            10
          </Pill>
        </div>
        {!items.length ? (
          <EmptyState
            icon={Bell}
            title="Nothing to keep an eye on."
            description="Add a sample PR watcher to see how a quiet notification would work."
          />
        ) : (
          items.map((w) => (
            <div className="watcher-row" key={w.id}>
              <span className="watcher-icon">
                <GitPullRequest size={20} />
              </span>
              <div className="watcher-info">
                <h3>
                  {w.repo} #{w.pr}
                </h3>
                <p>
                  When this pull request merges → Telegram message + voice note
                </p>
                <div className="toggle-group">
                  <Pill
                    tone={
                      w.status === "Active" || w.status === "Merged"
                        ? "success"
                        : "warning"
                    }
                  >
                    {w.status} · sample
                  </Pill>
                  <span className="small muted">
                    Every 60s · expires in 7 days · {w.failures}/5 failures
                  </span>
                </div>
              </div>
              <div className="watcher-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    integrate("watchers.manage", () =>
                      update(w.id, {
                        status: w.status === "Active" ? "Paused" : "Active",
                        failures: 0,
                      }),
                    )
                  }
                >
                  {w.status === "Active" ? "Pause" : "Renew / resume"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(w.id);
                    setRepo(w.repo);
                    setPr(String(w.pr));
                    setError("");
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <button
                  className="icon-button"
                  aria-label={`Stop watching ${w.repo} ${w.pr}`}
                  onClick={() => setRemove(w.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="panel mt-6">
        <h2>Explore a watcher’s life cycle</h2>
        <p className="mt-3">
          Sample events affect the first watcher only. A real watcher notifies
          once per change, never acts, and stops after 5 consecutive failures or
          7 days.
        </p>
        <div className="button-row">
          <Button
            disabled={!items.length}
            variant="outline"
            onClick={() => {
              update(items[0].id, { status: "Merged" });
              addWatcherNotice({
                title: `${items[0].repo} #${items[0].pr} merged`,
                detail:
                  "Your watcher caught a new event. Mark it seen to settle the eye.",
                href: "/watchers",
              });
              notify(
                "Sample notice: ONE FOR ALL here — PR merged. No Telegram message or audio was sent.",
              );
            }}
          >
            Preview merge notice
          </Button>
          <Button
            disabled={!items.length}
            variant="outline"
            onClick={() => update(items[0].id, { status: "Expired" })}
          >
            Expire at 7 days
          </Button>
          <Button
            disabled={!items.length}
            variant="outline"
            onClick={() =>
              update(items[0].id, { status: "Failed", failures: 5 })
            }
          >
            5 failures
          </Button>
          <Button
            disabled={!items.length}
            variant="outline"
            onClick={() => update(items[0].id, { status: "Closed" })}
          >
            Closed unmerged
          </Button>
        </div>
        <IntegrationButton id="watchers.manage" />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Edit sample watcher"
                : "A quiet heads-up, when it happens"}
            </DialogTitle>
            <DialogDescription>
              GitHub connection and backend polling are required for a real
              watcher.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} noValidate>
            <div className="field">
              <label htmlFor="watch-repo">Repository</label>
              <Input
                id="watch-repo"
                placeholder="owner/repository"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="watch-pr">Pull request number</label>
              <Input
                id="watch-pr"
                type="number"
                min="1"
                value={pr}
                onChange={(e) => setPr(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">
              {editing ? "Save sample watcher" : "Add sample watcher"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={remove !== null}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop this sample watcher?</DialogTitle>
            <DialogDescription>
              It will be removed from local state. A real watcher needs backend
              cancellation to stop its checks.
            </DialogDescription>
          </DialogHeader>
          <div className="button-row">
            <Button variant="outline" onClick={() => setRemove(null)}>
              Keep watching
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const id = remove;
                setRemove(null);
                integrate("watchers.manage", () =>
                  setItems((xs) => xs.filter((w) => w.id !== id)),
                );
              }}
            >
              Stop watcher preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
