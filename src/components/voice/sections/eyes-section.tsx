"use client";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDesktop } from "../desktop-provider";
import type {
  EyesMode,
  EyesPreview,
} from "@/lib/voice/local-development-client";

const MODES: { mode: EyesMode; title: string; detail: string }[] = [
  {
    mode: "local",
    title: "Local only",
    detail:
      "Reads the text and controls Windows exposes, plus on-device text recognition. Nothing leaves this computer and it costs nothing, but icons without text and pictures are not understood.",
  },
  {
    mode: "separate",
    title: "Separate eyes model",
    detail:
      "A vision model of its own looks at a screenshot when local reading is not enough. Works with any reasoning engine. Screenshots go to the model's provider, with password fields blacked out.",
  },
  {
    mode: "reasoning",
    title: "Same as reasoning model",
    detail:
      "The reasoning engine looks at the screenshot itself. Only possible when that model can see images; otherwise OFA uses local reading.",
  },
];

/** Settings → Eyes: how OFA understands the screen before its hands act. */
export function EyesSection() {
  const { state, saveOfa, eyesPreview } = useDesktop();
  const [model, setModel] = useState<string | null>(null);
  const [preview, setPreview] = useState<EyesPreview | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");
  const ofa = state.ofa;
  const eyes = ofa?.settings.eyes;

  const test = () => {
    setLooking(true);
    setError("");
    eyesPreview()
      .then(setPreview)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Eyes test failed.",
        ),
      )
      .finally(() => setLooking(false));
  };

  return (
    <section className="panel mt-6" aria-label="Eyes">
      <div className="section-heading">
        <h2>Eyes</h2>
        <span>
          {ofa
            ? `Now using: ${MODES.find((m) => m.mode === ofa.eyes.active)?.title ?? ofa.eyes.active}`
            : "Connect the computer first"}
        </span>
      </div>
      <p className="mt-3">
        OFA first reads what Windows reports about the screen. It only takes a
        screenshot when that is not enough, for example to find an icon or an
        incoming call. Every element it can click gets a number, and every click
        is checked by looking again.
      </p>

      {state.connected && ofa === null && (
        <p className="mt-3" role="status">
          OFA&apos;s brain is not running on this computer, so Eyes is off. Add
          a reasoning key to the companion&apos;s .env file and restart it.
        </p>
      )}

      {eyes && ofa && (
        <>
          <fieldset className="mt-4 grid gap-3">
            <legend className="font-semibold">
              How OFA understands the screen
            </legend>
            {MODES.map((option) => {
              const unavailable =
                option.mode === "reasoning" && !ofa.eyes.reasoning_can_see;
              return (
                <label
                  key={option.mode}
                  className="flex items-start gap-3 rounded border p-3"
                >
                  <input
                    type="radio"
                    name="eyes-mode"
                    value={option.mode}
                    checked={eyes.mode === option.mode}
                    disabled={unavailable}
                    onChange={() => saveOfa({ eyes: { mode: option.mode } })}
                  />
                  <span>
                    <span className="font-semibold">{option.title}</span>
                    <span className="block">{option.detail}</span>
                    {unavailable && (
                      <span className="block muted small">
                        The current reasoning model cannot see images.
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {eyes.mode === "separate" && (
            <div className="mt-4 grid gap-2">
              <label className="grid gap-1">
                <span>Eyes model</span>
                <input
                  value={model ?? eyes.model}
                  onChange={(event) => setModel(event.target.value)}
                  spellCheck={false}
                />
              </label>
              <div className="button-row">
                <Button
                  variant="outline"
                  disabled={!model || model === eyes.model}
                  onClick={() => {
                    if (model) saveOfa({ eyes: { model } });
                    setModel(null);
                  }}
                >
                  Save model
                </Button>
              </div>
              <p className="muted small">
                Uses the Groq key already on this computer. Calls are counted
                against a separate limit from reasoning.
              </p>
            </div>
          )}

          {ofa.eyes.note && <p className="mt-3">{ofa.eyes.note}</p>}

          <h3 className="mt-6">Test eyes</h3>
          <p className="mt-2">
            Shows what OFA would see right now: the screen with numbered marks
            and password fields blacked out. The picture stays on this page; it
            is not sent to any model.
          </p>
          <div className="button-row mt-2">
            <Button variant="outline" disabled={looking} onClick={test}>
              {looking ? "Looking…" : "Test eyes"}
            </Button>
          </div>
          {error && (
            <p className="mt-2" role="alert">
              {error}
            </p>
          )}
          {preview && (
            <figure className="mt-3">
              <Image
                src={preview.image}
                alt={`OFA's view of the screen with ${preview.marks} numbered marks`}
                width={1600}
                height={900}
                unoptimized
                className="h-auto w-full rounded border"
              />
              <figcaption className="mt-2">
                {preview.marks} marks from {preview.windows.length} windows ·
                read with {preview.sources.join(" + ")} · {preview.masked}
              </figcaption>
            </figure>
          )}
        </>
      )}
    </section>
  );
}
