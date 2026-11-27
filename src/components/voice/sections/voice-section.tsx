"use client";
import { Button } from "@/components/ui/button";
import { useDesktop } from "../desktop-provider";
import type { CompanionHealth } from "@/lib/voice/local-development-client";

const languageLabels: Record<string, string> = {
  auto: "Auto-detect from speech",
  en: "English",
  hi: "Hindi",
  hinglish: "Hindi-English",
};

function SpeechStatus({ health }: { health?: CompanionHealth }) {
  const speech = health?.speech;
  if (!speech)
    return (
      <p className="mt-2">
        Start the desktop companion to read its live speech configuration.
      </p>
    );
  const providers = [
    `${speech.deepgram_configured ? "Deepgram configured" : "Deepgram not configured"}`,
    `${speech.gradium_configured ? "Gradium configured" : "Gradium not configured"}`,
  ].join(" · ");
  return (
    <dl className="mt-2 grid gap-2">
      <div>
        <dt className="inline font-semibold">Runtime: </dt>
        <dd className="inline">
          {speech.mode === "live"
            ? "Live provider speech"
            : "Fake speech (no provider calls)"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Language: </dt>
        <dd className="inline">
          {languageLabels[speech.language] ?? speech.language}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Speech-to-text order: </dt>
        <dd className="inline">{speech.stt_order.join(" → ")}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Text-to-speech order: </dt>
        <dd className="inline">{speech.tts_order.join(" → ")}</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Keys on this computer: </dt>
        <dd className="inline">{providers}. Key values are never sent here.</dd>
      </div>
      <div>
        <dt className="inline font-semibold">Microphone mode: </dt>
        <dd className="inline">
          {speech.headphones
            ? "Headphones · interruption enabled"
            : "Speaker · capture gated while replying"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Command policy: </dt>
        <dd className="inline">
          {speech.command_only ? "Deterministic commands only" : "Extended"}
        </dd>
      </div>
    </dl>
  );
}

const replyLanguages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi (Roman script)" },
  { value: "hinglish", label: "Hinglish" },
] as const;

/** Settings → Voice: microphone, speech providers and the language OFA replies in. */
export function VoiceSection() {
  const { state, checkCompanion, saveOfa } = useDesktop();
  const connected = state.connected;
  const reply = state.ofa?.settings.voice.reply_language;
  return (
    <section className="panel mt-6" aria-label="Voice">
      <div className="section-heading">
        <h2>Voice</h2>
        <span>
          {connected
            ? state.voiceState && state.voiceState !== "IDLE"
              ? `Microphone ${state.voiceState.toLowerCase()}`
              : "Idle · press Caps Lock"
            : "Microphone not enabled"}
        </span>
      </div>
      <div className="section-heading mt-6">
        <h3>Speech providers</h3>
        <Button variant="outline" onClick={checkCompanion}>
          Check companion status
        </Button>
      </div>
      <SpeechStatus health={state.health} />

      <h3 className="mt-6">Reply language</h3>
      {state.ofa ? (
        <label className="mt-2 grid gap-1">
          <span>OFA speaks its replies in</span>
          <select
            value={reply}
            onChange={(event) =>
              saveOfa({
                voice: {
                  reply_language: event.target
                    .value as (typeof replyLanguages)[number]["value"],
                },
              })
            }
          >
            {replyLanguages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="mt-2">
          Connect the computer to choose the reply language. You can speak
          English, Hindi or Hinglish either way.
        </p>
      )}
    </section>
  );
}
