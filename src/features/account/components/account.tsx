"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe2,
  Mic,
  Play,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IntegrationButton,
  Notice,
  VoiceVideo,
  Pill,
  TrustLine,
} from "@/components/common";
import { useApp } from "@/app/providers/app-provider";

/** A real, local voice preview: browser speech when available, always a
 * visual simulation. Nothing is recorded, uploaded or sent to a service. */
function VoicePreview({ voice }: { voice: string }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setPlaying(false), 2800);
    return () => clearTimeout(timer);
  }, [playing]);
  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    },
    [],
  );
  const label =
    voice === "bright"
      ? "Bright & warm"
      : voice === "direct"
        ? "Simple & direct"
        : "Calm & clear";
  const play = () => {
    setPlaying(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const line = new SpeechSynthesisUtterance(
          "Hi, I’m ONE FOR ALL. I’ll keep things clear, and ask before I act.",
        );
        line.rate = voice === "bright" ? 1.1 : voice === "direct" ? 1.05 : 0.92;
        line.pitch = voice === "bright" ? 1.2 : voice === "direct" ? 0.85 : 1;
        line.onend = () => setPlaying(false);
        window.speechSynthesis.speak(line);
      } catch {
        // The visual preview continues when browser speech is unavailable.
      }
    }
  };
  return (
    <div className="voice-preview">
      <div className="button-row">
        <Button variant="outline" onClick={play}>
          <Play size={15} />
          {playing ? `Playing ${label}…` : `Play ${label} sample`}
        </Button>
        <span className={`voice-preview-bars${playing ? " active" : ""}`} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <p className="small muted">
        Uses your browser’s speech when available. Nothing is recorded or sent.
      </p>
    </div>
  );
}
export function AuthScreen({
  mode,
}: {
  mode: "sign-in" | "sign-up" | "recover";
}) {
  const { integrate, setRole } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const signup = mode === "sign-up",
    recover = mode === "recover";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!recover && password.length < 8)
      next.password = "Use at least 8 characters for this form preview.";
    if (signup && !consent)
      next.consent = "Accept the privacy notice to continue.";
    if (signup && !adult)
      next.adult = "You must confirm that you are an adult.";
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(
        () => document.getElementById(Object.keys(next)[0])?.focus(),
        0,
      );
      return;
    }
    integrate(recover ? "auth.recovery" : "auth.email", () => {
      setPassword("");
      setSent(true);
    });
  };
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <VoiceVideo compact staticPoster />
        <h2>Less doing the busywork. More doing your thing.</h2>
        <p>
          Your voice, a clear plan, and a little help in the browser you already
          use.
        </p>
        <TrustLine />
      </div>
      <div className="auth-form">
        <h1>
          {signup
            ? "A workspace of your own."
            : recover
              ? "Let's get you back in."
              : "Welcome back."}
        </h1>
        <p>
          {signup
            ? "Connect your browser, keep your final say."
            : recover
              ? "Enter your email to preview account recovery."
              : "Pick up the conversation where you left it."}
        </p>
        {sent ? (
          <div className="stack mt-6">
            <Notice>
              {recover
                ? "Preview only: eligible accounts would receive recovery instructions. No email was sent."
                : signup
                  ? "Registration preview complete. A real account needs email verification and server-side consent."
                  : "Sign-in form preview complete. No session or account was created."}
            </Notice>
            <Button
              onClick={() => {
                setRole("member");
                router.push("/onboarding");
              }}
            >
              Enter member demo <ArrowRight size={16} />
            </Button>
            <Button variant="ghost" onClick={() => setSent(false)}>
              Back to form
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={submit} noValidate>
              {Object.keys(errors).length > 1 && (
                <Notice tone="danger">
                  Please correct the highlighted fields. Your values have been
                  kept.
                </Notice>
              )}
              <div className="field">
                <label htmlFor="email">Email address</label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p className="field-error" id="email-error">
                    {errors.email}
                  </p>
                )}
              </div>
              {!recover && (
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={signup ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  {errors.password && (
                    <p className="field-error" id="password-error">
                      {errors.password}
                    </p>
                  )}
                </div>
              )}
              {signup && (
                <>
                  <label className="auth-checkbox">
                    <input
                      id="consent"
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      aria-describedby={
                        errors.consent ? "consent-error" : undefined
                      }
                    />
                    <span>
                      I have read and accept the{" "}
                      <Link className="text-foreground underline" href="/privacy">
                        privacy notice
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.consent && (
                    <p id="consent-error" className="field-error">
                      {errors.consent}
                    </p>
                  )}
                  <label className="auth-checkbox">
                    <input
                      id="adult"
                      type="checkbox"
                      checked={adult}
                      onChange={(e) => setAdult(e.target.checked)}
                      aria-describedby={
                        errors.adult ? "adult-error" : undefined
                      }
                    />
                    <span>I confirm that I am an adult.</span>
                  </label>
                  {errors.adult && (
                    <p id="adult-error" className="field-error">
                      {errors.adult}
                    </p>
                  )}
                </>
              )}
              <Button className="full-button" type="submit">
                {recover
                  ? "Review recovery integration"
                  : signup
                    ? "Create account preview"
                    : "Sign in preview"}
                <ArrowRight size={16} />
              </Button>
            </form>
            {!recover && (
              <>
                <div className="auth-divider">or</div>
                <Button
                  variant="outline"
                  className="full-button"
                  onClick={() => {
                    setPassword("");
                    setSent(true);
                  }}
                >
                  <span className="font-bold" aria-hidden="true">
                    G
                  </span>
                  Continue with Google
                </Button>
              </>
            )}
            <div className="auth-footer">
              <Link href={signup || recover ? "/sign-in" : "/sign-up"}>
                {signup || recover ? "Back to sign in" : "Create an account"}
              </Link>
              {!recover && <Link href="/recover">Forgot password?</Link>}
            </div>
            <div className="demo-entry">
              <p>Just exploring? No credentials needed.</p>
              <Button
                variant="secondary"
                className="full-button"
                onClick={() => {
                  setRole("member");
                  router.push("/onboarding");
                }}
              >
                Enter member demo
              </Button>
              <p className="small muted mt-3">
                Demo entry is local navigation, not authentication.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export function Onboarding() {
  const { role, notify, start, completeOnboarding } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [adult, setAdult] = useState(false);
  const [consent, setConsent] = useState(false);
  const [voice, setVoice] = useState("calm");
  const [paired, setPaired] = useState(false);
  const [orchestratorConnected, setOrchestratorConnected] = useState(false);
  const [orchestratorInfo, setOrchestratorInfo] = useState(false);
  const [installInfo, setInstallInfo] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [micInfo, setMicInfo] = useState(false);
  const [turn, setTurn] = useState<{
    from: number;
    to: number;
    dir: "next" | "prev";
  } | null>(null);
  const turnTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (turnTimer.current) window.clearTimeout(turnTimer.current);
    },
    [],
  );
  const go = (to: number) => {
    if (turn || to < 0 || to > 4 || to === step) return;
    setTurn({ from: step, to, dir: to > step ? "next" : "prev" });
    turnTimer.current = window.setTimeout(() => {
      setStep(to);
      setTurn(null);
      turnTimer.current = null;
    }, 620);
  };
  const renderStep = (n: number) => (
    <>
      <Pill>Step {n + 1} of 5 · local preview</Pill>
      {n === 0 ? (
          <>
            <h2>Your browser deserves clear boundaries.</h2>
            <p>
              ONE FOR ALL only uses tabs in its own group. It never types passwords,
              never handles payments, and asks before anything is sent. You can
              pause at any time.
            </p>
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I have read the{" "}
                <Link href="/privacy" className="underline">
                  one-page privacy notice
                </Link>
                .
              </span>
            </label>
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />
              <span>I confirm I am an adult.</span>
            </label>
          </>
      ) : n === 1 ? (
          <>
            <h2>A voice that feels right.</h2>
            <p>
              Stock voices speak English. Members can choose Hindi-English
              transcription later in Settings.
            </p>
            <fieldset className="voice-options">
              <legend className="sr-only">Stock voice</legend>
              {[
                ["calm", "Calm & clear", "A steady, considered pace."],
                [
                  "bright",
                  "Bright & warm",
                  "A little more energy, without the rush.",
                ],
                [
                  "direct",
                  "Simple & direct",
                  "Clear, concise and to the point.",
                ],
              ].map(([id, title, desc]) => (
                <label className="voice-option" key={id}>
                  <input
                    type="radio"
                    name="voice"
                    value={id}
                    checked={voice === id}
                    onChange={() => setVoice(id)}
                  />
                  <Volume2 size={19} />
                  <span>
                    {title}
                    <small>{desc}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <VoicePreview voice={voice} />
            <div className="mt-4">
              <IntegrationButton
                id="voice.session"
                label="Voice integration details"
              />
            </div>
            {role === "owner" && (
              <p className="small mt-4">
                Owner voice enrolment is in the{" "}
                <Link href="/voice-lab" className="underline">
                  Voice lab
                </Link>
                .
              </p>
            )}
          </>
      ) : n === 2 ? (
          <>
            <h2>Your Chrome, with a helping hand.</h2>
            <p>
              Install ONE FOR ALL, return to this website, then connect this browser
              with a one-time pairing code.
            </p>
            <ol className="plan-list mt-6">
              <li>
                <span className="step-marker">1</span>Add the ONE FOR ALL extension
                from the Chrome Web Store (not published in this preview).
              </li>
              <li>
                <span className="step-marker">2</span>Return here and connect
                this browser.
              </li>
              <li>
                <span className="step-marker">3</span>Use the ONE FOR ALL tab
                group. Alt+Shift+J pauses; Chrome’s debugging-bar Cancel detaches
                immediately.
              </li>
            </ol>
            <div className="button-row">
              <Button
                variant="outline"
                onClick={() => setInstallInfo((v) => !v)}
                aria-expanded={installInfo}
              >
                <Globe2 size={16} />
                Add ONE FOR ALL to Chrome
              </Button>
              <Button onClick={() => setPairingOpen(true)}>
                {paired ? <Check size={16} /> : <ShieldCheck size={16} />}{" "}
                {paired ? "Pairing illustrated" : "Connect this browser preview"}
              </Button>
            </div>
            {installInfo && (
              <Notice>
                The extension is not published in this preview, so there is no
                store page to open. In the real product, this button installs a
                Chromium extension. You can still illustrate the pairing step
                with the button beside it.
              </Notice>
            )}
            {paired && (
              <Notice>
                Sample pairing only. No extension is installed or connected.
              </Notice>
            )}
          </>
      ) : n === 3 ? (
          <>
            <h2>Bring your own brain for hard tasks.</h2>
            <p>
              The built-in agent handles everyday requests. For a tough,
              multi-step challenge you can connect your own model or API — a
              Claude subscription, another provider, or a local model. When a
              model is connected, the orchestrator wakes up and takes the hard
              ones.
            </p>
            <div
              className={
                "orchestrator-status" +
                (orchestratorConnected ? " active" : "")
              }
            >
              <span className="orchestrator-dot" aria-hidden="true" />
              <div>
                <strong>
                  {orchestratorConnected
                    ? "Orchestrator active"
                    : "Orchestrator dormant"}
                </strong>
                <small>
                  {orchestratorConnected
                    ? "Ready for complex, multi-step requests"
                    : "Connect a model to enable complex requests"}
                </small>
              </div>
              <Pill tone={orchestratorConnected ? "success" : "warning"}>
                {orchestratorConnected ? "Active" : "Inactive"}
              </Pill>
            </div>
            <div className="orchestrator-example">
              <strong>Example of a tough request</strong>
              <p>
                “Compare three pricing providers, draft a note for #engineering
                with the result, and ask me before anything is sent.”
              </p>
              <small>
                Today the preview answers with a local plan. With an
                orchestrator connected, this is the kind of request it would
                break down and drive.
              </small>
            </div>
            <Notice tone="warning">
              The connection flow is not defined yet. How a user actually
              connects a model or API is still an open question and backend
              work. In this preview, connecting only illustrates the state — no
              key, account or request is sent.
            </Notice>
            <div className="button-row">
              <Button
                variant="outline"
                onClick={() => setOrchestratorInfo((v) => !v)}
                aria-expanded={orchestratorInfo}
              >
                <Sparkles size={16} />
                Model connection details
              </Button>
              <Button
                onClick={() => {
                  setOrchestratorConnected(true);
                  notify(
                    "Model connection illustrated locally. No model or API was connected.",
                  );
                }}
              >
                {orchestratorConnected ? (
                  <Check size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {orchestratorConnected
                  ? "Connected (illustrated)"
                  : "Connect a model (illustration)"}
              </Button>
            </div>
            {orchestratorInfo && (
              <Notice>
                Open question: OAuth, API key, or a local bridge? The logic is
                not defined yet. This step reserves the UI only; it is not
                wired to any provider.
              </Notice>
            )}
          </>
        ) : (
          <>
            <h2>Try something safe, first.</h2>
            <p>
              Fill a sample job application in the Playground. You’ll see a
              question, the draft, and the final review before a simulated
              submission.
            </p>
            <Notice>
              No mic access is requested in this build. Typing works throughout.
              Live audio will require a permission prompt after a user gesture.
            </Notice>
            <div className="button-row">
              <Button
                variant="outline"
                onClick={() => setMicInfo((v) => !v)}
                aria-expanded={micInfo}
              >
                <Mic size={16} />
                Microphone details
              </Button>
              <Button
                onClick={() => {
                  start("jobs");
                  notify(
                    "Sample job task is ready. Open it from the live panel or the Playground whenever you like.",
                  );
                }}
              >
                Start safe local task
                <ArrowRight size={16} />
              </Button>
            </div>
            {micInfo && (
              <Notice>
                This preview never opens a microphone. When live voice is added,
                your browser will ask for permission after you tap Speak, and
                typed requests will keep working if you decline.
              </Notice>
            )}
          </>
        )}
      <div className="step-footer">
        <Button
          variant="ghost"
          disabled={n === 0 || !!turn}
          onClick={() => go(n - 1)}
        >
          Back
        </Button>
        {n < 4 ? (
          <Button
            disabled={(n === 0 && (!consent || !adult)) || !!turn}
            onClick={() => go(n + 1)}
          >
            {n === 2
              ? "Continue without a real connection"
              : n === 3
                ? "Continue without connecting a model"
                : "Continue"}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            disabled={!!turn}
            onClick={() => {
              completeOnboarding();
              router.push("/");
            }}
          >
            Finish setup <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </>
  );
  const visibleStep = turn ? turn.to : step;
  return (
    <div className="onboarding onboarding-layout">
      <aside className="onboarding-story">
        <VoiceVideo compact staticPoster />
        <h2>Less doing the busywork. More doing your thing.</h2>
        <p>
          Your voice, a clear plan, and a little help in the browser you already
          use.
        </p>
        <TrustLine />
      </aside>
      <div className="onboarding-stage">
        <div className="page-title">
          <div>
            <h1>A little setup. Then, less busywork.</h1>
            <p>A preview of your first few minutes with ONE FOR ALL.</p>
          </div>
        </div>
        <div
          className="onboarding-steps"
          role="group"
          aria-label={`Step ${visibleStep + 1} of 5`}
        >
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={n <= visibleStep ? "done" : ""} />
          ))}
        </div>
        <section className="panel onboarding-panel book-stack">
          {turn && (
            <div
              className={`book-page page-out-${turn.dir}`}
              key={`out-${turn.from}`}
              aria-hidden="true"
            >
              {renderStep(turn.from)}
            </div>
          )}
          <div
            className={`book-page ${turn ? `page-in-${turn.dir}` : ""}`}
            key={visibleStep}
          >
            {renderStep(visibleStep)}
          </div>
        </section>
      </div>
      <Dialog open={pairingOpen} onOpenChange={setPairingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect this browser preview</DialogTitle>
            <DialogDescription>
              This is a simulated one-time code. No extension is installed and
              no browser is paired.
            </DialogDescription>
          </DialogHeader>
          <div className="consent-phrase" aria-label="Demo pairing code">
            OFA-DEMO-2026
          </div>
          <Notice>
            In the real product, the extension shows this code once and
            exchanges it for a revocable device key. Here it only illustrates
            the step.
          </Notice>
          <Button
            onClick={() => {
              setPaired(true);
              setPairingOpen(false);
              notify("Pairing illustrated locally. No device was connected.");
            }}
          >
            Mark pairing illustrated
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
