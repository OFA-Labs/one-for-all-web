"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  GitPullRequest,
  Globe2,
  Layers3,
  LockKeyhole,
  Maximize2,
  MessageSquare,
  Monitor,
  X,
} from "lucide-react";
import { HoverCard } from "radix-ui";
import { scenarios, type Task } from "@/lib/demo";
import {
  getTabCaptures,
  tabOutcome,
  tabStatus,
  type TabCapture,
} from "@/lib/browser-history";
import { cn } from "@/lib/utils";
import { useApp } from "./provider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import "./browser-decks.css";

function SiteIcon({ site }: { site: string }) {
  const Icon = site.includes("github")
    ? GitPullRequest
    : site.includes("slack")
      ? MessageSquare
      : Globe2;
  return <Icon size={14} aria-hidden="true" />;
}

function Capture({
  capture,
  site,
  compact = false,
}: {
  capture: TabCapture;
  site: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn("tab-capture", compact && "compact")}
      aria-hidden={compact || undefined}
    >
      <div className="tab-capture-chrome">
        <span className="tab-window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{site}</span>
        <LockKeyhole size={10} aria-hidden="true" />
      </div>
      <div className="tab-capture-page">
        <div className="tab-capture-site">
          <SiteIcon site={site} />
          <span>{site.split(".")[0]}</span>
        </div>
        <div className="tab-capture-rule" />
        <span className="tab-capture-label">Sample capture</span>
        <h4>{capture.title}</h4>
        {capture.draft && (
          <p className="tab-capture-account">{capture.draft.account}</p>
        )}
        <p className="tab-capture-copy">{capture.content}</p>
        {!!capture.items?.length && (
          <ul>
            {capture.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        {capture.draft?.file && (
          <div className="tab-capture-attachment">{capture.draft.file}</div>
        )}
        {capture.draft?.declaration && (
          <p className="tab-capture-copy">{capture.draft.declaration}</p>
        )}
        <div className="tab-capture-page-footer">
          ONE FOR ALL <span>Local preview</span>
        </div>
      </div>
    </div>
  );
}

function WithheldCapture({ task }: { task: Task }) {
  return (
    <div className="tab-capture-withheld">
      <LockKeyhole size={24} aria-hidden="true" />
      <strong>Preview hidden</strong>
      <p>
        {task.status === "driving"
          ? "Page images are withheld while you use the browser."
          : "Browser offline. Page images are withheld until reconnection."}
      </p>
    </div>
  );
}

function TabConversation({ task, site }: { task: Task; site: string }) {
  const drafts = task.drafts.filter((draft) => draft.site === site);
  return (
    <section
      className="tab-conversation"
      aria-label={`Conversation and activity for ${site}`}
      tabIndex={0}
    >
      <div className="tab-conversation-heading">
        <MessageSquare size={15} aria-hidden="true" />
        <h3>Conversation & activity</h3>
      </div>
      <div className="tab-message user">
        <span>You</span>
        <p>{task.goal}</p>
      </div>
      <div className="tab-message">
        <span>ONE FOR ALL</span>
        <p>{scenarios[task.scenario].description}</p>
      </div>
      <div className="tab-activity">
        <h4>Task activity</h4>
        <ol>
          {task.events.map((event, index) => (
            <li key={`${index}-${event}`}>
              <span className="tab-activity-index">{index + 1}</span>
              <p>{event}</p>
            </li>
          ))}
        </ol>
      </div>
      {task.answer && (
        <div className="tab-message user">
          <span>You · clarification</span>
          <p>{task.answer}</p>
        </div>
      )}
      {drafts.map((draft) => (
        <div className="tab-message draft" key={draft.id}>
          <span>Draft · {draft.action}</span>
          <p className="tab-draft-account">{draft.account}</p>
          <p>{draft.text}</p>
          {draft.file && <p className="tab-draft-attachment">{draft.file}</p>}
          {draft.declaration && <p>{draft.declaration}</p>}
        </div>
      ))}
      <div className="tab-message">
        <span>ONE FOR ALL · {tabStatus(task)}</span>
        <p>{tabOutcome(task)}</p>
      </div>
      <p className="tab-conversation-note">
        This is the complete conversation and task activity available in this
        local preview. Captures are illustrative.
      </p>
    </section>
  );
}

export function BrowserTiles({
  task,
  large = false,
}: {
  task: Task | null;
  large?: boolean;
}) {
  const { integrate } = useApp();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    site: string;
    captureId: string;
  } | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const returnSite = useRef<string | null>(null);
  const captureScroll = useRef<HTMLDivElement>(null);
  const sites = task ? scenarios[task.scenario].sites : [];
  const hidden = !!task && ["offline", "driving"].includes(task.status);
  const selectedSite =
    selected && sites.includes(selected.site) ? selected.site : null;
  const selectedCaptures =
    task && selectedSite ? getTabCaptures(task, selectedSite) : [];
  const matchingIndex = selectedCaptures.findIndex(
    (capture) => capture.id === selected?.captureId,
  );
  const selectedIndex =
    matchingIndex < 0 ? selectedCaptures.length - 1 : matchingIndex;
  const activeCapture = selectedCaptures[selectedIndex];
  const openCapture = (site: string, captureId: string) => {
    returnSite.current = site;
    setHovered(null);
    setSelected({ site, captureId });
  };
  const chooseCapture = (capture: TabCapture) => {
    if (!selectedSite) return;
    setSelected({ site: selectedSite, captureId: capture.id });
    captureScroll.current?.scrollTo({ top: 0 });
  };

  if (!task || sites.length === 0)
    return (
      <div className="browser-decks-empty browser-empty">
        <div className="browser-illustration">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <div className="browser-sample-line" />
          <div className="browser-sample-line short" />
          <div className="browser-mini-orb">
            <Monitor size={28} />
          </div>
        </div>
        <h3>
          {task?.status === "declined"
            ? "No tabs opened"
            : "A window into the work"}
        </h3>
        <p>
          {task?.status === "declined"
            ? "This request was declined before any tool ran."
            : "When a task starts, its browser tabs appear as decks. Open a deck to explore its captures and conversation."}
        </p>
        {!task && (
          <Button variant="outline" onClick={() => integrate("browser.pair")}>
            How browser connection works <ArrowUpRight size={15} />
          </Button>
        )}
      </div>
    );

  return (
    <div className="browser-decks">
      <div className="tab-deck-guide">
        <Layers3 size={14} aria-hidden="true" />
        <span>One deck per tab. Hover to peek, click to explore.</span>
      </div>
      <div className={cn("tab-deck-grid", large && "large")}>
        {sites.map((site) => {
          const captures = getTabCaptures(task, site);
          const latest = captures[captures.length - 1];
          const layers = captures.slice(-6, -1);
          return (
            <HoverCard.Root
              key={site}
              open={hovered === site && !selectedSite}
              onOpenChange={(open) =>
                setHovered((current) =>
                  open ? site : current === site ? null : current,
                )
              }
              openDelay={180}
              closeDelay={150}
            >
              <article
                className="tab-deck"
                data-preview={hovered === site}
                aria-label={`${site} tab deck`}
              >
                <div className="tab-deck-stack">
                  {layers.map((capture, index) => (
                    <div
                      className="tab-deck-back"
                      style={{ "--layer": index } as CSSProperties}
                      key={capture.id}
                      aria-hidden="true"
                    >
                      <span className="tab-window-dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>{capture.title}</span>
                    </div>
                  ))}
                  <HoverCard.Trigger
                    asChild
                    // Enter opens the complete history. Returning keyboard focus
                    // after closing it should not reopen the pointer preview.
                    onFocus={(event) => event.preventDefault()}
                  >
                    <button
                      className="tab-deck-front"
                      ref={(element) => {
                        if (element) triggers.current.set(site, element);
                        else triggers.current.delete(site);
                      }}
                      onClick={() => openCapture(site, latest.id)}
                      aria-label={`Open ${site} tab history`}
                      aria-haspopup="dialog"
                    >
                      {hidden ? (
                        <WithheldCapture task={task} />
                      ) : (
                        <Capture capture={latest} site={site} compact />
                      )}
                      <span className="tab-deck-expand">
                        <Maximize2 size={17} aria-hidden="true" />
                        <span>Open tab</span>
                      </span>
                    </button>
                  </HoverCard.Trigger>
                </div>
                <div className="tab-deck-caption">
                  <span>{captures.length} captures</span>
                </div>
                <p className="tab-deck-status">
                  <span className="dot" />
                  {tabStatus(task)}
                </p>
              </article>
              <HoverCard.Portal>
                <HoverCard.Content
                  className="tab-hover-panel"
                  side="top"
                  align="start"
                  sideOffset={12}
                  collisionPadding={18}
                  onEscapeKeyDown={() => setHovered(null)}
                >
                  <div className="tab-hover-heading">
                    <div>
                      <SiteIcon site={site} />
                      <strong>{site}</strong>
                    </div>
                    <button
                      className="tab-preview-close"
                      aria-label="Dismiss tab preview"
                      onClick={() => setHovered(null)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="tab-hover-subtitle">
                    <span>Capture history</span>
                    <span>{captures.length} views</span>
                  </div>
                  <div
                    className="tab-hover-history"
                    role="region"
                    aria-label={`${site} capture history preview`}
                    tabIndex={0}
                  >
                    {hidden ? (
                      <WithheldCapture task={task} />
                    ) : (
                      captures.map((capture, index) => (
                        <button
                          className="tab-hover-capture"
                          key={capture.id}
                          onClick={() => openCapture(site, capture.id)}
                          aria-label={`Open ${site} capture ${index + 1}: ${capture.title}`}
                        >
                          <Capture capture={capture} site={site} compact />
                          <span>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{capture.title}</strong>
                            <ArrowUpRight size={13} aria-hidden="true" />
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="tab-hover-footer">
                    <ArrowDown size={12} aria-hidden="true" />
                    <span>Scroll through captures · click to open</span>
                  </div>
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          );
        })}
      </div>
      <Dialog
        open={!!selectedSite}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setHovered(null);
          }
        }}
      >
        <DialogContent
          className="tab-deck-dialog"
          overlayClassName="tab-deck-overlay"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnSite.current)
              triggers.current.get(returnSite.current)?.focus();
          }}
        >
          {selectedSite && activeCapture && (
            <>
              <DialogHeader className="tab-detail-heading">
                <div className="tab-detail-title">
                  <SiteIcon site={selectedSite} />
                  <DialogTitle>{selectedSite}</DialogTitle>
                </div>
                <DialogDescription>
                  Tab history · {selectedCaptures.length} illustrative captures
                  · {tabStatus(task)}
                </DialogDescription>
              </DialogHeader>
              <div className="tab-detail-layout">
                <section
                  className="tab-screenshot-history"
                  aria-label="Screenshot history"
                >
                  <div className="tab-history-toolbar">
                    <h3>Screenshot history</h3>
                    <div>
                      <button
                        className="tab-history-arrow"
                        aria-label="Previous capture"
                        disabled={selectedIndex === 0}
                        onClick={() =>
                          chooseCapture(selectedCaptures[selectedIndex - 1])
                        }
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <span aria-live="polite">
                        {selectedIndex + 1} / {selectedCaptures.length}
                      </span>
                      <button
                        className="tab-history-arrow"
                        aria-label="Next capture"
                        disabled={selectedIndex === selectedCaptures.length - 1}
                        onClick={() =>
                          chooseCapture(selectedCaptures[selectedIndex + 1])
                        }
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="tab-capture-scroll"
                    ref={captureScroll}
                    role="region"
                    aria-label="Selected tab capture"
                    tabIndex={0}
                  >
                    <div className="tab-selected-capture-title">
                      <span>Capture {selectedIndex + 1}</span>
                      <h3>{activeCapture.title}</h3>
                    </div>
                    {hidden ? (
                      <WithheldCapture task={task} />
                    ) : (
                      <Capture capture={activeCapture} site={selectedSite} />
                    )}
                  </div>
                  <div
                    className="tab-frame-strip"
                    role="group"
                    aria-label="Choose a capture"
                  >
                    {selectedCaptures.map((capture, index) => (
                      <button
                        key={capture.id}
                        ref={
                          index === selectedIndex
                            ? (element) =>
                                element?.scrollIntoView({
                                  block: "nearest",
                                  inline: "nearest",
                                })
                            : undefined
                        }
                        onClick={() => chooseCapture(capture)}
                        aria-pressed={index === selectedIndex}
                        aria-label={`View capture ${index + 1}: ${capture.title}`}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>{capture.title}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <TabConversation task={task} site={selectedSite} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
