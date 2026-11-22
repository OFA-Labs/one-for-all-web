"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, Mic, Play, ShieldCheck } from "lucide-react";
import { useApp } from "@/app/providers/app-provider";
import { Button } from "@/components/ui/button";
import { IntegrationButton, Notice, PageTitle, Pill } from "@/components/common";
import { downloadFile } from "@/lib/utils";
const cases = [
  {
    category: "currency",
    text: "₹8,50,000 CTC, 12 LPA",
    expected:
      "eight lakh fifty thousand rupees cost to company; twelve lakh per annum",
  },
  {
    category: "names",
    text: "Aarav, Shreya, Bengaluru",
    expected: "Reference pronunciation requires owner recording",
  },
  {
    category: "dates",
    text: "20 Nov 2026, 9 PM IST",
    expected:
      "twentieth November twenty twenty-six, nine PM Indian Standard Time",
  },
  {
    category: "abbreviations",
    text: "SDE-2, 2 YoE",
    expected: "S D E two, two years of experience",
  },
  {
    category: "urls",
    text: "hello@example.test",
    expected: "hello at example dot test",
  },
  {
    category: "phone",
    text: "+91 98765 43210",
    expected:
      "plus nine one, nine eight seven six five, four three two one zero",
  },
  {
    category: "versions",
    text: "v2.1.0",
    expected: "version two point one point zero",
  },
  { category: "code", text: "const n = 3", expected: "const n equals three" },
  { category: "equations", text: "E = mc²", expected: "E equals m c squared" },
  {
    category: "citations",
    text: "[12], Fig. 3",
    expected: "reference twelve, figure three",
  },
  {
    category: "hinglish",
    text: "ruk, pehle salary check kar",
    expected: "Hindi-English transcription expected; English speech output",
  },
];
export function VoiceLab() {
  const { role, integrate, notify } = useApp();
  const [take, setTake] = useState(2);
  const [category, setCategory] = useState("all");
  const [strategy, setStrategy] = useState("raw-on");
  const [seed, setSeed] = useState("1");
  const [run, setRun] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const today = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  if (role !== "owner")
    return (
      <>
        <PageTitle
          title="A voice that’s yours."
          description="Voice cloning and the speech harness are owner-only in iteration 1."
        />
        <Notice>
          These controls are hidden for visitors and members. The production
          backend must enforce the same role; a client selector is not a
          security boundary.
        </Notice>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/">Back to assistant</Link>
        </Button>
        <p className="small muted mt-4">
          To inspect this UI, choose “Owner view” in the header. No privileges
          or account are granted.
        </p>
      </>
    );
  return (
    <>
      <PageTitle
        title="A voice, carefully made."
        description="Owner enrolment and speech measurement previews. No recording, cloning, transcription or evaluation is running."
        action={<Pill>Owner-only preview</Pill>}
      />
      <div className="panel-grid">
        <section className="panel">
          <h2>Three takes. Your choice.</h2>
          <p className="mt-3">
            Production enrolment records 20–30 seconds of scripted English with
            noise processing off. This build never opens your mic.
          </p>
          <blockquote className="reader-quote">
            “Hello, I’m Jai. I’d like ONE FOR ALL to speak clearly, listen carefully,
            and pause when I need a moment.”
          </blockquote>
          <div className="take-buttons">
            {[1, 2, 3].map((n) => (
              <Button
                key={n}
                variant={take === n ? "default" : "outline"}
                onClick={() => {
                  setTake(n);
                  notify(
                    `Take ${n} selected as a UI example. No recording exists.`,
                  );
                }}
              >
                Take {n} · sample
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={() => integrate("voice.clone")}>
            <Mic size={16} />
            Review recording integration
          </Button>
        </section>
        <section className="panel">
          <h2>Consent is part of the voice.</h2>
          <p className="mt-3">
            Production: three cryptographically random words plus today’s date,
            spoken within 30 seconds and checked by transcription. This fixed
            example is not a valid consent challenge.
          </p>
          <div className="consent-phrase">river · lantern · cedar</div>
          <p>{today} · Asia/Kolkata</p>
          <div className="lab-result">
            <strong>30-second challenge window · static preview</strong>
            <p>
              Selected take: {take}. No consent proof or voice ID is generated
              or stored.
            </p>
          </div>
          <Button
            className="mt-5"
            onClick={() =>
              integrate("voice.clone", () =>
                notify("Consent layout reviewed. No voice clone was created."),
              )
            }
          >
            <ShieldCheck size={16} />
            Review consent workflow
          </Button>
        </section>
        <section className="panel panel-wide">
          <div className="section-heading">
            <h2>The words that need extra care.</h2>
            <Pill>Not measured</Pill>
          </div>
          <p>
            Compare raw rewriting off, raw on, and custom rewriting. Real runs
            need three seeds, whole and chunked delivery, two independent
            non-Gradium transcribers, cached audio and blind ratings.
          </p>
          <div className="search-bar mt-6">
            <select
              aria-label="Speech category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {cases.map((c) => (
                <option key={c.category}>{c.category}</option>
              ))}
            </select>
            <select
              aria-label="Rewriting strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              <option value="raw-off">Raw · rewriting off</option>
              <option value="raw-on">Raw · rewriting on</option>
              <option value="custom">Custom speakable text</option>
            </select>
            <select
              aria-label="Test seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            >
              <option value="1">Seed 1</option>
              <option value="2">Seed 2</option>
              <option value="3">Seed 3</option>
            </select>
            <Button
              onClick={() => integrate("speech.harness", () => setRun(true))}
            >
              <Play size={15} />
              Preview test layout
            </Button>
          </div>
          {run && (
            <Notice>
              Layout preview only: {strategy}, seed {seed}. No scores, timings,
              provider request IDs or audio have been measured.
            </Notice>
          )}
          <div className="table-wrap mt-5">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Original text</th>
                  <th>Reference spoken form</th>
                  <th>Audio / rating</th>
                </tr>
              </thead>
              <tbody>
                {cases
                  .filter((c) => category === "all" || c.category === category)
                  .map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td>{c.text}</td>
                      <td>{c.expected}</td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`rating-${c.category}`}
                        >
                          Sample rating for {c.category}
                        </label>
                        <select
                          id={`rating-${c.category}`}
                          value={ratings[c.category] || ""}
                          onChange={(e) =>
                            setRatings((r) => ({
                              ...r,
                              [c.category]: e.target.value,
                            }))
                          }
                        >
                          <option value="">No audio to rate</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option value={String(n)} key={n}>
                              {n}/5 · UI example
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="button-row">
            <Button
              variant="outline"
              onClick={() =>
                downloadFile(
                  "GRADIUM_FEEDBACK-template.md",
                  `# Gradium feedback — UNMEASURED TEMPLATE\n\nNo real run or audio exists.\n\n${["APIs used", "Pronunciation", "Consistency and pacing", "Streaming", "Transcription", "Docs and SDK", "What would have helped"].map((h) => `## ${h}\nRequest ID: [pending]\nText: [pending]\nSettings: [pending]\nAudio: [pending]\nObserved result: [pending]\n`).join("\n")}`,
                )
              }
            >
              <Download size={16} />
              Export feedback template
            </Button>
            <IntegrationButton id="speech.harness" />
          </div>
        </section>
      </div>
    </>
  );
}
