"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { ArrowDown, AudioLines, BookOpen, Play, Square } from "lucide-react";
import { statusToOrb, type OrbState } from "@/lib/demo";
import { useApp } from "@/app/providers/app-provider";
import { Assistant } from "./assistant";
import { Reader } from "./reader";
import { VoiceVideo } from "@/components/common";
import { HomeVideo } from "./home-video";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "./ofa.css";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function OFA({ initialMode = "ask" }: { initialMode?: "ask" | "read" }) {
  const ready = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverReady,
  );
  const { task } = useApp();
  const [mode, setMode] = useState(initialMode);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [source, setSource] = useState<"ask" | "read">("ask");
  const [reading, setReading] = useState(false);
  const [sentence, setSentence] = useState("");
  const [orb, setOrb] = useState<OrbState | null>(null);
  const [animationFailed, setAnimationFailed] = useState(false);
  const sessionVideo = useRef<HTMLVideoElement>(null);
  const workspaceHeading = useRef<HTMLHeadingElement>(null);
  const workspaceRequested = useRef(false);

  const stop = useCallback(() => {
    sessionVideo.current?.pause();
    setMoving(false);
    setReading(false);
  }, []);
  const openSession = useCallback((nextSource: "ask" | "read" = "ask") => {
    setSource(nextSource);
    setSessionOpen(true);
    setMoving(true);
    setAnimationFailed(false);
    if (nextSource === "ask") setReading(false);
  }, []);
  const closeSession = useCallback(() => {
    stop();
    setSessionOpen(false);
  }, [stop]);
  const toggleSession = () => {
    if (moving) stop();
    else {
      setMoving(true);
      if (source === "read") setReading(true);
      void sessionVideo.current?.play().catch(() => {});
    }
  };
  const changeReading = useCallback(
    (next: boolean) => {
      if (!next) {
        stop();
        return;
      }
      setReading(true);
      openSession("read");
    },
    [openSession, stop],
  );
  // Reading can finish while the manually started orb continues its loop.
  const finishReading = useCallback(() => setReading(false), []);

  // Resolve deep links after the streamed workspace has mounted. The browser
  // can attempt its initial fragment scroll before this client tree exists.
  useEffect(() => {
    if (!ready || window.location.hash !== "#ofa-workspace") return;
    document.getElementById("ofa-workspace")?.scrollIntoView({
      behavior: "instant",
      block: "start",
    });
  }, [ready]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!["F1", "F2"].includes(event.key) || event.repeat) return;
      if (!sessionOpen && document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      event.stopPropagation();
      if (sessionOpen) toggleSession();
      else openSession(mode);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  });

  const revealWorkspace = () => {
    document.getElementById("ofa-workspace")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <section
        className="assistant-hero ofa-hero"
        aria-label="O F A voice stage"
      >
        <HomeVideo active={!sessionOpen} />
        <nav className="ofa-hero-nav" aria-label="Workspace shortcuts">
          <Link href="/playground">Playground</Link>
          <Link href="/history">History</Link>
          <Link href="/watchers">Watchers</Link>
          <Link href="/connections">Connections</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/onboarding">Get started</Link>
        </nav>
        <div className="ofa-hero-center">
          <p className="ofa-hero-kicker">ONE FOR ALL</p>
          <button
            className="hero-orb-button"
            disabled={!ready}
            aria-label="Tap to speak"
            aria-haspopup="dialog"
            aria-keyshortcuts="F1 F2"
            onClick={() => openSession("ask")}
          >
            <span className="voice-video-stage" aria-hidden="true" />
            <span className="hero-orb-label">Tap to speak</span>
          </button>
          <p className="ofa-hero-copy">
            A hand with your tasks. A voice for your words.
          </p>
          <a className="ofa-enter-workspace" href="#ofa-workspace">
            Open workspace <ArrowDown size={14} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section
        className="assistant-workspace ofa-workspace"
        id="ofa-workspace"
        aria-label="O F A workspace"
      >
        <fieldset
          className="ofa-workspace-inner"
          disabled={!ready}
          aria-label="O F A controls"
        >
          <header className="ofa-heading">
            <div>
              <span className="ofa-section-label">Home</span>
              <h1 ref={workspaceHeading} tabIndex={-1}>
                Assistant
              </h1>
              <p className="ofa-section-purpose">
                Speak a request, hear a response, or have a page read aloud.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => openSession(mode)}
              aria-label="Open voice session"
            >
              <AudioLines size={16} />
              Speak
            </Button>
          </header>
          <Tabs
            value={mode}
            onValueChange={(value) => {
              const nextMode = value === "read" ? "read" : "ask";
              stop();
              setMode(nextMode);
              window.history.replaceState(
                null,
                "",
                nextMode === "read"
                  ? "/?mode=read#ofa-workspace"
                  : "/#ofa-workspace",
              );
            }}
            className="ofa-modes"
          >
            <TabsList
              className="ofa-mode-switch"
              aria-label="O F A workspace mode"
            >
              <TabsTrigger value="ask">
                <AudioLines size={16} />
                Ask & act
              </TabsTrigger>
              <TabsTrigger value="read">
                <BookOpen size={16} />
                Read & listen
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="ask"
              forceMount
              hidden={mode !== "ask"}
              className="ofa-mode-panel"
            >
              <Assistant orb={orb} onOrbChange={setOrb} onInterrupt={stop} />
            </TabsContent>
            <TabsContent
              value="read"
              forceMount
              hidden={mode !== "read"}
              className="ofa-mode-panel"
            >
              <Reader
                playing={reading}
                onPlayingChange={changeReading}
                onFinish={finishReading}
                onSentenceChange={setSentence}
              />
            </TabsContent>
          </Tabs>
        </fieldset>
      </section>

      <Dialog
        open={sessionOpen}
        onOpenChange={(open) => {
          if (!open) closeSession();
        }}
      >
        <DialogContent
          className="ofa-orb-dialog"
          overlayClassName="ofa-orb-overlay"
          onCloseAutoFocus={(event) => {
            if (!workspaceRequested.current) return;
            event.preventDefault();
            workspaceRequested.current = false;
            workspaceHeading.current?.focus({ preventScroll: true });
            revealWorkspace();
          }}
          onKeyDown={(event) => {
            if (
              event.code === "Space" &&
              !(event.target as HTMLElement).closest(
                "button,input,textarea,select,a",
              )
            ) {
              event.preventDefault();
              toggleSession();
            }
          }}
        >
          <DialogHeader className="ofa-session-heading">
            <DialogTitle>O F A</DialogTitle>
            <DialogDescription>
              {source === "read" ? "Your reading space" : "Your voice space"}
            </DialogDescription>
          </DialogHeader>
          <button
            className="ofa-session-orb"
            aria-label={moving ? "Stop orb animation" : "Resume orb animation"}
            aria-pressed={moving}
            onClick={toggleSession}
          >
            <VoiceVideo
              state={
                orb ||
                (moving
                  ? source === "read"
                    ? "Speaking"
                    : task
                      ? statusToOrb[task.status]
                      : "Listening"
                  : "Idle")
              }
              playing={moving}
              compact
              persist
              videoRef={sessionVideo}
              onFailureChange={setAnimationFailed}
            />
          </button>
          <div className="ofa-session-content" aria-live="polite">
            {source === "read" && sentence ? (
              <p className="ofa-reading-sentence">{sentence}</p>
            ) : (
              <p>
                {animationFailed
                  ? "Your typed workspace is still available."
                  : moving
                    ? "Take your time. There’s room to talk."
                    : "A moment of quiet."}
              </p>
            )}
            <span>
              {animationFailed
                ? "Animation unavailable · typed workspace ready"
                : moving
                  ? source === "read" && reading
                    ? "Reading preview"
                    : "Animation playing"
                  : "Stopped"}
            </span>
          </div>
          <Button className="ofa-session-stop" onClick={toggleSession}>
            {moving ? <Square size={14} /> : <Play size={16} />}
            {moving ? "Stop" : "Resume"}
          </Button>
          <p className="ofa-session-caption">Visual preview · microphone off</p>
          <button
            className="ofa-session-workspace text-button"
            onClick={() => {
              workspaceRequested.current = true;
              closeSession();
            }}
          >
            Open workspace <ArrowDown size={13} aria-hidden="true" />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
