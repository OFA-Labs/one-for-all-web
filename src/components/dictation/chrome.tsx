"use client";

import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import {
  CircleAlert,
  Copy,
  Keyboard,
  Mic,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { DictationContextValue } from "./provider";

export function dictationStatus(api: DictationContextValue) {
  const { state } = api;
  if (!state.enabled) return "Off";
  if (state.connection === "error") return "Inactive";
  if (state.phase === "ERROR") return "Error";
  if (state.connection !== "ready") return "Preparing";
  if (state.phase === "IDLE") return "Ready";
  return {
    STARTING: "Starting",
    LISTENING: "Listening",
    PROCESSING: "Transcribing",
    INSERTING: "Inserting",
  }[state.phase];
}

export function DictationChrome({ api }: { api: DictationContextValue }) {
  const { state, send } = api;
  const [acknowledged, setAcknowledged] = useState(false);
  const active = state.phase !== "IDLE" && state.enabled;
  const status = dictationStatus(api);
  const text =
    state.phase === "STARTING"
      ? "Starting…"
      : state.phase === "LISTENING"
        ? "Listening · Press CAPS to stop"
        : state.phase === "PROCESSING"
          ? `Transcribing…${state.progress.retry ? ` (retry ${state.progress.retry}/2)` : state.progress.part ? ` part ${state.progress.part}/${state.progress.totalParts}` : ""}`
          : state.phase === "INSERTING"
            ? "Inserting…"
            : state.error;
  const elapsed = `${String(Math.floor(state.elapsedMs / 60000)).padStart(2, "0")}:${String(Math.floor(state.elapsedMs / 1000) % 60).padStart(2, "0")}`;
  const isCapturing = state.phase === "STARTING" || state.phase === "LISTENING";

  return (
    <>
      <Dialog
        open={api.consentOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAcknowledged(false);
            api.closeConsent();
          }
        }}
      >
        <DialogContent className="dictation-consent">
          <DialogHeader>
            <span className="dictation-demo-label">Frontend preview</span>
            <DialogTitle>Make Caps Lock your dictation switch.</DialogTitle>
            <DialogDescription>
              One press to start, one press to stop. Enable this preview only
              when you are ready.
            </DialogDescription>
          </DialogHeader>
          <ul className="dictation-consent-list">
            <li>
              <Keyboard size={18} aria-hidden="true" />
              <div>
                <strong>Only the shortcut is handled</strong>
                <p>
                  Only Caps Lock events are inspected. Other keystrokes are not
                  stored or logged. Modified shortcuts pass through.
                </p>
              </div>
            </li>
            <li>
              <Mic size={18} aria-hidden="true" />
              <div>
                <strong>No microphone or transcription service</strong>
                <p>
                  This preview uses sample text and simulated levels. No audio
                  is recorded or sent. The planned speech provider is Gradium.
                </p>
              </div>
            </li>
            <li>
              <CircleAlert size={18} aria-hidden="true" />
              <div>
                <strong>This website, not other Windows apps</strong>
                <p>
                  Caps Lock works here while the page is focused. It cannot
                  reserve Windows Caps Lock or type into other apps. Native
                  capture, clipboard restoration and the desktop tray are not
                  connected.
                </p>
              </div>
            </li>
          </ul>
          <p className="dictation-consent-help">
            Disable at any time in Settings or the floating controls menu. A
            future desktop host would reserve Caps Lock and leave Shift + Caps
            Lock for capitalization; that Windows behavior is not implemented
            here.
          </p>
          <label className="dictation-consent-check">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(value) => setAcknowledged(value === true)}
            />
            <span>
              I understand this is a simulation with no audio capture or
              external insertion.
            </span>
          </label>
          <div className="button-row">
            <Button
              disabled={!acknowledged}
              onClick={() => {
                setAcknowledged(false);
                api.confirmEnable();
              }}
            >
              Enable preview
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAcknowledged(false);
                api.closeConsent();
              }}
            >
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {state.hydrated &&
        state.enabled &&
        createPortal(
          <>
            {active && (
              <div
                className="dictation-pill"
                data-dictation-overlay
                data-phase={state.phase}
                role="group"
                aria-label="Dictation preview indicator"
              >
                {state.phase === "LISTENING" && state.warned && (
                  <span className="dictation-cap-warning" role="alert">
                    Limit in{" "}
                    {Math.max(
                      0,
                      Math.ceil(
                        (state.settings.maxRecordingMinutes * 60000 -
                          state.elapsedMs) /
                          60000,
                      ),
                    )}{" "}
                    min. The preview will be processed.
                  </span>
                )}
                <span
                  className="dictation-pill-pulse"
                  key={state.pulse}
                  aria-hidden="true"
                />
                <Mic size={16} aria-hidden="true" />
                {state.phase === "LISTENING" && (
                  <>
                    <span className="dictation-meter" aria-hidden="true">
                      {state.levels.map((level, index) => (
                        <i
                          key={index}
                          style={
                            { "--level": `${level * 2}px` } as CSSProperties
                          }
                        />
                      ))}
                    </span>
                    <span className="dictation-static-dot" aria-hidden="true" />
                  </>
                )}
                <span
                  className="dictation-pill-text"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  title={text}
                >
                  {text}
                </span>
                <span className="dictation-pill-demo">Demo</span>
                {state.phase === "LISTENING" && (
                  <span className="dictation-elapsed" aria-hidden="true">
                    {elapsed}
                  </span>
                )}
                {state.phase === "ERROR" && state.session?.transcript && (
                  <button
                    className="dictation-pill-action"
                    aria-label="Copy preview transcript"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() =>
                      void api.copyText(state.session!.transcript!)
                    }
                  >
                    <Copy size={14} />
                  </button>
                )}
                <button
                  className="dictation-pill-action"
                  aria-label={
                    state.phase === "ERROR"
                      ? "Dismiss dictation error"
                      : "Cancel and discard dictation preview"
                  }
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() =>
                    send({
                      type: state.phase === "ERROR" ? "CLEAR_ERROR" : "CANCEL",
                      now: Date.now(),
                    })
                  }
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="dictation-launcher"
                  aria-label={`Dictation controls: ${status}`}
                >
                  <Keyboard size={17} aria-hidden="true" />
                  <span className="dictation-launcher-status" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="dictation-controls-menu"
                  side="top"
                  align="end"
                  sideOffset={10}
                  collisionPadding={12}
                >
                  <DropdownMenu.Label>
                    Dictation preview <span>{status}</span>
                  </DropdownMenu.Label>
                  <DropdownMenu.Item
                    disabled={
                      state.connection !== "ready" ||
                      ["PROCESSING", "INSERTING"].includes(state.phase)
                    }
                    onSelect={api.toggle}
                  >
                    {isCapturing ? "Stop preview" : "Start preview"}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/settings?tab=dictation#recent-dictations">
                      Recent dictations
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/settings?tab=dictation">
                      Dictation settings <MoreHorizontal size={14} />
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={api.disable}>
                    Disable dictation preview
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </>,
          document.body,
        )}
    </>
  );
}
