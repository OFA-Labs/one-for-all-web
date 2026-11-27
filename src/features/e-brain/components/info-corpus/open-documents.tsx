"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDesktop } from "@/components/voice/desktop-provider";
import type { CorpusDocument } from "@/lib/voice/local-development-client";

const message = (reason: unknown) =>
  reason instanceof Error ? reason.message : "That did not work.";

/** Markdown documents OFA may read and send to the reasoning model: resume, profile, saved answers. */
export function OpenDocuments() {
  const { corpus } = useDesktop();
  const [documents, setDocuments] = useState<CorpusDocument[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(
    () =>
      corpus
        .corpusDocuments()
        .then(setDocuments)
        .catch((reason: unknown) => setStatus(message(reason))),
    [corpus],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const open = (document: string) =>
    corpus
      .corpusRead(document)
      .then((body) => {
        setName(document);
        setText(body);
        setStatus(`Opened ${document}.`);
      })
      .catch((reason: unknown) => setStatus(message(reason)));
  const save = () =>
    corpus
      .corpusSave(name.trim(), text)
      .then(() => {
        setStatus("Saved on this computer.");
        return load();
      })
      .catch((reason: unknown) => setStatus(message(reason)));
  const remove = () =>
    corpus
      .corpusDelete(name.trim())
      .then(() => {
        setName("");
        setText("");
        setStatus("Document deleted.");
        return load();
      })
      .catch((reason: unknown) => setStatus(message(reason)));
  const saved = documents.some((d) => d.name === name.trim().toLowerCase());

  return (
    <div className="mt-4 grid gap-3">
      <p>
        OFA reads these without asking and sends the relevant parts to the
        reasoning model. Do not put passwords or ID numbers here.
      </p>
      <div className="button-row" role="group" aria-label="Documents">
        {documents.map((document) => (
          <Button
            key={document.name}
            variant={document.name === name ? "default" : "outline"}
            onClick={() => void open(document.name)}
          >
            {document.name}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() => {
            setName("");
            setText("");
            setStatus("New document.");
          }}
        >
          New document
        </Button>
      </div>
      <label className="grid gap-1">
        <span>Document name</span>
        <Input
          value={name}
          maxLength={60}
          placeholder="resume"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-1">
        <span>Contents (Markdown)</span>
        <Textarea
          value={text}
          rows={16}
          className="max-h-[32rem]"
          spellCheck={false}
          placeholder={"# Resume\n\n## Contact\n- Full name: …"}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <div className="button-row">
        <Button
          disabled={!name.trim() || !text.trim()}
          onClick={() => void save()}
        >
          Save document
        </Button>
        <Button
          variant="outline"
          disabled={!saved}
          onClick={() => void remove()}
        >
          Delete document
        </Button>
      </div>
      <p role="status">{status}</p>
    </div>
  );
}
