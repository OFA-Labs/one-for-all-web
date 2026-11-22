"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Link2,
  Pause,
  Play,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useApp } from "./provider";
import { segmentText } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FlagButton, IntegrationButton, Notice, Pill } from "./common";
const sample =
  "On 20 November 2026, Aarav and Shreya will demo ONE FOR ALL at 9 PM IST. The role offers ₹8,50,000 per year, with 2 years of experience. Send your CV to hello@example.test. Version 2.1 adds streaming, interruption, and a clearer way to say ‘wait’.";
export function Reader({
  playing,
  onPlayingChange: setPlaying,
  onFinish,
  onSentenceChange,
}: {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  onFinish: () => void;
  onSentenceChange: (sentence: string) => void;
}) {
  const { integrate, notify } = useApp();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState(sample);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState("");
  const [fileError, setFileError] = useState("");
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState("1");
  const [voice, setVoice] = useState("Calm & clear");
  const sentences = segmentText(text);
  const currentSentence = sentences[position] || "";
  useEffect(() => {
    onSentenceChange(currentSentence);
  }, [currentSentence, onSentenceChange]);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(
      () => {
        if (position >= sentences.length - 1) onFinish();
        else setPosition(position + 1);
      },
      2400 / Number(speed),
    );
    return () => clearTimeout(timer);
  }, [playing, position, sentences.length, speed, onFinish]);
  const loadFile = async (f: File | undefined) => {
    setFileError("");
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setFileError("Choose a file under 10 MB.");
      return;
    }
    if (!/\.(pdf|txt)$/i.test(f.name)) {
      setFileError("Choose a PDF or plain-text file.");
      return;
    }
    setFile(`${f.name} · ${(f.size / 1024).toFixed(1)} KB · local only`);
    setPlaying(false);
    setPosition(0);
    if (f.name.toLowerCase().endsWith(".txt")) setText(await f.text());
    else
      integrate("reader.speech", () => {
        setText(sample);
        notify(
          "PDF filename previewed locally. Extraction is not implemented; displaying sample text.",
        );
      });
  };
  return (
    <div className="ofa-reader">
      <div className="ofa-reader-heading">
        <h2>Make room to listen.</h2>
        <Pill>{playing ? "Highlighting preview" : "Ready to read"}</Pill>
      </div>
      <div className="reader-grid">
        <section className="panel reader-editor">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v);
              setPlaying(false);
            }}
          >
            <TabsList>
              <TabsTrigger value="text">
                <BookOpen size={15} />
                Text
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 size={15} />
                Link
              </TabsTrigger>
              <TabsTrigger value="file">
                <FileText size={15} />
                PDF / text file
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="tab-panel">
              <label htmlFor="reader-text">What would you like to hear?</label>
              <Textarea
                id="reader-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setPosition(0);
                  setPlaying(false);
                }}
                rows={7}
              />
              <div className="button-row">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setText(sample);
                    setPosition(0);
                    setPlaying(false);
                  }}
                >
                  Use hard-text sample
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setText("");
                    setPosition(0);
                    setPlaying(false);
                  }}
                >
                  Clear text
                </Button>
                <span className="small muted">
                  {text.length.toLocaleString()} characters
                </span>
              </div>
            </TabsContent>
            <TabsContent value="link" className="tab-panel">
              <p>
                This preview does not fetch the URL. It loads a sample passage so
                you can explore the reading controls. In the real product only
                public pages would be read; private-network addresses and
                logged-in content stay out of bounds.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  integrate("reader.speech", () => {
                    setText(sample);
                    setPosition(0);
                    notify("Sample content loaded. The URL was not fetched.");
                  });
                }}
              >
                <label htmlFor="reader-url">Public page URL</label>
                <Input
                  id="reader-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://example.com/article"
                />
                <Button type="submit" variant="outline" className="mt-4">
                  Load sample content
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="file" className="tab-panel">
              <div className="upload-zone">
                <Upload size={25} />
                <label htmlFor="reader-file">
                  Choose a PDF or plain-text file
                </label>
                <input
                  id="reader-file"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => void loadFile(e.target.files?.[0])}
                  aria-describedby="reader-file-help"
                />
                <p id="reader-file-help" className="small">
                  Up to 10 MB. Nothing is uploaded. TXT text is read locally; a
                  PDF shows its filename and a sample passage because text
                  extraction is not available in this preview.
                </p>
              </div>
              {file && <p className="small mt-4">{file}</p>}
              {fileError && (
                <p className="field-error" role="alert">
                  {fileError}
                </p>
              )}
            </TabsContent>
          </Tabs>
          <div className="reader-toolbar">
            <div className="button-row mt-0">
              <Button
                disabled={!sentences.length}
                onClick={() =>
                  playing
                    ? setPlaying(false)
                    : integrate("reader.speech", () => {
                        if (position >= sentences.length - 1) setPosition(0);
                        setPlaying(true);
                      })
                }
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
                {playing ? "Pause preview" : "Preview reading"}
              </Button>
              <button
                className="icon-button"
                aria-label="Restart reading preview"
                onClick={() => {
                  setPosition(0);
                  setPlaying(false);
                }}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            <label>
              Highlight speed
              <select
                aria-label="Reading speed"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
              >
                <option value="0.75">0.75×</option>
                <option value="1">1×</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
              </select>
            </label>
            <label htmlFor="reader-voice">
              Voice label
              <select
                id="reader-voice"
                aria-label="Reading voice"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                <option>Calm & clear</option>
                <option>Bright & warm</option>
                <option>Simple & direct</option>
              </select>
            </label>
          </div>
          <div
            className="reader-progress"
            role="progressbar"
            aria-label="Sentence preview progress"
            aria-valuemin={0}
            aria-valuemax={sentences.length}
            aria-valuenow={sentences.length ? position + 1 : 0}
          >
            <div
              style={{
                width: sentences.length
                  ? `${((position + 1) / sentences.length) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <Notice>
            This is a silent, visual-only preview: sentences highlight in time,
            but no audio is produced. Speed changes the highlight timing and the
            voice label is for reference only. Link and PDF text extraction are
            not available in this preview.
          </Notice>
          <IntegrationButton id="reader.speech" />
        </section>
      </div>
      <section className="panel mt-6">
        <div className="section-heading">
          <h2>Follow the sentence</h2>
          <span className="small muted">
            Tap a sentence to seek · flags stay local
          </span>
        </div>
        {sentences.length ? (
          sentences.map((s, i) => (
            <div
              className={`sentence-row ${i === position ? "active" : ""}`}
              key={`${i}-${s}`}
            >
              <button
                className="sentence-text"
                onClick={() => setPosition(i)}
                aria-current={i === position ? "true" : undefined}
              >
                {s}
              </button>
              <FlagButton
                id={`reader-${i}-${s.slice(0, 20)}`}
                label={s.length > 42 ? `${s.slice(0, 42)}…` : s}
              />
            </div>
          ))
        ) : (
          <p>Paste some text above to begin a reading preview.</p>
        )}
      </section>
    </div>
  );
}
