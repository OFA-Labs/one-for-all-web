"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useDesktop } from "@/components/voice/desktop-provider";
import type { PrivateView } from "@/lib/voice/local-development-client";

const message = (reason: unknown) =>
  reason instanceof Error ? reason.message : "That did not work.";
const EMPTY = {
  service: "",
  label: "",
  value: "",
  site: "",
  account: "",
  sensitive: false,
};

/** Passwords and other secrets: OFA can use them, never see them, and asks aloud before every use. */
export function PrivateItems() {
  const { corpus } = useDesktop();
  const [view, setView] = useState<PrivateView | null>(null);
  const [item, setItem] = useState(EMPTY);
  const [status, setStatus] = useState("");

  useEffect(() => {
    corpus
      .privateItems()
      .then(setView)
      .catch((reason: unknown) => setStatus(message(reason)));
  }, [corpus]);

  const act = (
    action: Parameters<typeof corpus.privateAction>[0],
    body?: Parameters<typeof corpus.privateAction>[1],
    done = "",
  ) =>
    corpus
      .privateAction(action, body)
      .then((next) => {
        setView(next);
        setStatus(done);
        return true;
      })
      .catch((reason: unknown) => {
        setStatus(message(reason));
        return false;
      });
  const add = (event: FormEvent) => {
    event.preventDefault();
    const { account, ...rest } = item;
    // An empty account is left out: it means "any account".
    const body = account.trim() ? { ...rest, account: account.trim() } : rest;
    void act("add", body, "Saved. The value cannot be read back.").then(
      (ok) => ok && setItem(EMPTY),
    );
  };
  const set = (key: "service" | "label" | "value" | "site" | "account") => ({
    value: item[key],
    onChange: (event: { target: { value: string } }) =>
      setItem((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="mt-4 grid gap-3">
      <p>
        OFA never sees these values and never sends them to a model. Before each
        use it tells you the item, the website and the field, and waits for your
        spoken yes. It fills them only on the website you name here.
      </p>
      <div className="button-row">
        {view?.unlocked ? (
          <Button
            variant="outline"
            onClick={() => void act("lock", {}, "Private items locked.")}
          >
            Lock
          </Button>
        ) : (
          <Button
            onClick={() => {
              setStatus("Answer the Windows prompt on this computer.");
              void act("unlock").then(
                (ok) => ok && setStatus("Check the status below."),
              );
            }}
          >
            Unlock
          </Button>
        )}
        <span>{view?.unlocked ? "Unlocked" : "Locked"}</span>
      </div>

      <ul className="grid gap-2" aria-label="Private items">
        {view?.items.map((entry) => (
          <li
            key={entry.handle}
            className="flex flex-wrap items-center gap-3 rounded border p-3"
          >
            <span className="font-semibold">
              {entry.service} · {entry.label}
            </span>
            <span>{entry.allowed_targets.join(", ")}</span>
            {entry.expected_account ? (
              <span>Only for {entry.expected_account}</span>
            ) : null}
            {entry.revoked ? <span className="muted">Revoked</span> : null}
            <span className="button-row ml-auto">
              <Button
                variant="outline"
                disabled={!!entry.revoked}
                onClick={() => void act("revoke", { handle: entry.handle })}
              >
                Revoke
              </Button>
              <Button
                variant="outline"
                onClick={() => void act("delete", { handle: entry.handle })}
              >
                Delete
              </Button>
            </span>
          </li>
        ))}
        {view && view.items.length === 0 && <li>No private items yet.</li>}
      </ul>

      <form className="grid gap-3" onSubmit={add} aria-label="Add private item">
        <h3>Add a private item</h3>
        <label className="grid gap-1">
          <span>Service</span>
          <Input required placeholder="gmail" {...set("service")} />
        </label>
        <label className="grid gap-1">
          <span>Item name</span>
          <Input required placeholder="password" {...set("label")} />
        </label>
        <label className="grid gap-1">
          <span>Secret value</span>
          <Input
            required
            type="password"
            autoComplete="new-password"
            {...set("value")}
          />
        </label>
        <label className="grid gap-1">
          <span>Website where it may be used</span>
          <Input
            required
            placeholder="https://accounts.google.com"
            {...set("site")}
          />
        </label>
        <label className="grid gap-1">
          <span>Account it belongs to (optional)</span>
          <Input
            maxLength={200}
            placeholder="name@example.com"
            aria-describedby="private-account-help"
            {...set("account")}
          />
        </label>
        <p id="private-account-help" className="muted">
          If you set this, OFA fills the item only while the page shows this
          account.
        </p>
        <label className="flex items-center gap-3">
          <Switch
            checked={item.sensitive}
            onCheckedChange={(sensitive) =>
              setItem((current) => ({ ...current, sensitive }))
            }
          />
          <span>Identity, bank or health detail (not a password)</span>
        </label>
        <div className="button-row">
          <Button type="submit" disabled={!view?.unlocked}>
            Save private item
          </Button>
        </div>
      </form>
      <p role="status">{status}</p>
    </div>
  );
}
