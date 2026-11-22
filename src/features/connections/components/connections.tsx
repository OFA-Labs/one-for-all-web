"use client";
import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  GitBranch,
  Globe2,
  Laptop,
  Link2,
  Monitor,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/app/providers/app-provider";
import { IntegrationButton, Notice, PageTitle, Pill } from "@/components/common";
export function Connections() {
  const { role, integrate, notify } = useApp();
  const [devices, setDevices] = useState([
    { id: 1, label: "Chrome on your laptop", online: true },
    { id: 2, label: "Edge on your desktop", online: false },
  ]);
  const [primary, setPrimary] = useState(1);
  const [connected, setConnected] = useState<Record<string, boolean>>({
    github: true,
    drive: false,
    telegram: false,
  });
  const [permissions, setPermissions] = useState([
    { site: "github.com", scope: "Always access" },
    { site: "slack.com", scope: "This task only" },
  ]);
  const [remove, setRemove] = useState<{
    kind: "device" | "connection" | "permission";
    id: string;
  } | null>(null);
  const [code, setCode] = useState(false);
  const connectors = [
    {
      id: "drive",
      name: "Google Drive",
      icon: FolderOpen,
      feature: "files.drive",
      description: "Only the files you pick. Not your entire Drive.",
      account: "Choose a Google account",
    },
    {
      id: "github",
      name: "GitHub",
      icon: GitBranch,
      feature: "connections.github",
      description:
        "Pull requests and quiet watchers, even with your laptop off.",
      account: "jai-example · sample account",
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: Send,
      feature: "connections.telegram",
      description: "A heads-up on your phone. Approval links return to ONE FOR ALL.",
      account: "Link with a one-time code",
    },
  ];
  const disconnect = () => {
    if (!remove) return;
    const target = remove;
    setRemove(null);
    integrate(
      target.kind === "permission"
        ? "browser.permissions"
        : "browser.disconnect",
      () => {
        if (target.kind === "device") {
          setDevices((xs) => xs.filter((d) => d.id !== Number(target.id)));
          if (primary === Number(target.id))
            setPrimary(
              devices.find((d) => d.id !== Number(target.id))?.id || 0,
            );
        }
        if (target.kind === "connection")
          setConnected((xs) => ({ ...xs, [target.id]: false }));
        if (target.kind === "permission")
          setPermissions((xs) => xs.filter((p) => p.site !== target.id));
        notify("Local sample disconnected. No real access token was revoked.");
      },
    );
  };
  return (
    <>
      <PageTitle
        title="Your world, connected on your terms."
        description="Choose a browser. Pick the files. Let the rest stay private."
        action={
          <Button variant="outline" asChild>
            <Link href="/extension">
              Extension preview
              <Link2 size={15} />
            </Link>
          </Button>
        }
      />
      <Notice>
        Sample connections only.{" "}
        {role === "visitor"
          ? "Members can connect their own browser after sign-up. "
          : ""}
        “Online” below illustrates the intended state; no browser is actually
        paired.
      </Notice>
      <section className="panel mt-6">
        <div className="section-heading">
          <h2>Your browsers</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              integrate("browser.pair", () => {
                setDevices((xs) => [
                  ...xs,
                  {
                    id: Date.now(),
                    label: "New Chrome · local sample",
                    online: true,
                  },
                ]);
                notify("Added a fictional browser row. No handshake occurred.");
              })
            }
          >
            <Plus size={15} />
            Connect browser preview
          </Button>
        </div>
        {devices.length ? (
          devices.map((d) => (
            <div className="list-row" key={d.id}>
              <div className="toggle-group">
                <Laptop size={25} className="text-foreground" />
                <div>
                  <strong className="text-[13px]">{d.label}</strong>
                  <p className="small">
                    {d.online
                      ? "Last seen just now · sample"
                      : "Last seen 2 hours ago · sample"}
                  </p>
                </div>
              </div>
              <div className="button-row mt-0">
                <Pill tone={d.online ? "success" : "warning"}>
                  {d.online ? "Online" : "Offline"} preview
                </Pill>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPrimary(d.id);
                    notify("Primary browser changed in local preview.");
                  }}
                  disabled={primary === d.id}
                >
                  {primary === d.id ? "Primary" : "Make primary"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRemove({ kind: "device", id: String(d.id) })
                  }
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p>No sample browser connected. Add one to explore the pairing UI.</p>
        )}
        <IntegrationButton id="browser.pair" label="Browser pairing details" />
      </section>
      <div className="panel-grid mt-6">
        {connectors.map((c) => (
          <section className="panel connection-card" key={c.id}>
            <div className="section-heading">
              <span className="connection-symbol">
                <c.icon size={23} />
              </span>
              <Pill tone={connected[c.id] ? "success" : "neutral"}>
                {connected[c.id] ? "Connected · sample" : "Not connected"}
              </Pill>
            </div>
            <h2>{c.name}</h2>
            <p>{c.description}</p>
            <span className="small muted">{c.account}</span>
            <div className="button-row">
              <Button
                variant="outline"
                onClick={() =>
                  connected[c.id]
                    ? setRemove({ kind: "connection", id: c.id })
                    : integrate(c.feature, () => {
                        if (c.id === "telegram") setCode(true);
                        else {
                          setConnected((x) => ({ ...x, [c.id]: true }));
                          notify(
                            "Sample consent illustrated. No provider connection was made.",
                          );
                        }
                      })
                }
              >
                {connected[c.id]
                  ? "Disconnect"
                  : c.id === "telegram"
                    ? "Get linking code preview"
                    : "Review connection"}
              </Button>
              <IntegrationButton id={c.feature} label="Details" />
            </div>
            <div className="connection-meta">
              <span>
                Last used: {connected[c.id] ? "today · sample" : "never"}
              </span>
              <span>Read and prepare; commits still need approval</span>
            </div>
          </section>
        ))}
        {role === "owner" && (
          <section className="panel connection-card">
            <div className="section-heading">
              <span className="connection-symbol">
                <Monitor size={23} />
              </span>
              <Pill>Owner · stretch</Pill>
            </div>
            <h2>Desktop Companion</h2>
            <p>
              Explicitly enabled desktop apps and folders. View-only unless a
              task is active. Not installed or functional in this preview.
            </p>
            <Button
              variant="outline"
              onClick={() => integrate("stretch.desktop")}
            >
              Explore companion requirements
            </Button>
          </section>
        )}
      </div>
      <section className="panel mt-6">
        <div className="section-heading">
          <h2>Site access</h2>
          <Pill>Access is not approval</Pill>
        </div>
        {permissions.length ? (
          permissions.map((p) => (
            <div className="list-row" key={p.site}>
              <div className="toggle-group">
                <Globe2 size={18} />
                <div>
                  <strong className="text-[13px]">{p.site}</strong>
                  <p className="small">{p.scope} · last used today, sample</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRemove({ kind: "permission", id: p.site })}
              >
                Revoke
              </Button>
            </div>
          ))
        ) : (
          <p>No sample site permissions remain.</p>
        )}
        <IntegrationButton
          id="browser.permissions"
          label="Site access details"
        />
      </section>
      <Dialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect this sample {remove?.kind}?</DialogTitle>
            <DialogDescription>
              A real disconnection revokes the credential, pauses affected tasks
              and removes live views. This preview only updates local state.
            </DialogDescription>
          </DialogHeader>
          <div className="button-row">
            <Button variant="outline" onClick={() => setRemove(null)}>
              Keep connected
            </Button>
            <Button variant="destructive" onClick={disconnect}>
              Disconnect sample
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={code} onOpenChange={setCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A short code, for your phone.</DialogTitle>
            <DialogDescription>
              This is a non-redeemable example. There is no live bot or real
              expiry timer.
            </DialogDescription>
          </DialogHeader>
          <div className="consent-phrase">DEMO-7241</div>
          <p>
            Production: send a one-time code to the configured ONE FOR ALL bot within
            5 minutes. Group chats are not supported.
          </p>
          <Notice>
            No Telegram link was made. Real linking requires the bot to confirm
            the exact user.
          </Notice>
          <Button
            onClick={() => {
              setConnected((x) => ({ ...x, telegram: true }));
              setCode(false);
              notify(
                "Telegram linked state illustrated locally. No message sent.",
              );
            }}
          >
            Show linked-state preview
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
