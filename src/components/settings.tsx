"use client";
import { useState } from "react";
import Link from "next/link";
import { Save, Volume2 } from "lucide-react";
import { useApp } from "./provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { IntegrationButton, Notice, PageTitle, Pill } from "./common";
import { DictationWorkspace } from "./dictation/workspace";

const SETTINGS_TABS = [
  "personal",
  "voice",
  "dictation",
  "safety",
  "usage",
] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];
const initial = {
  name: "Jai",
  language: "en",
  voice: "Calm & clear",
  concerns: true,
  pushToTalk: false,
  telegram: true,
  location: "NCR",
  salary: "12",
  notice: "30",
  channel: "Brother’s channel · sample",
  mode: "Hybrid",
};
export function SettingsPage({ initialTab = "personal" }: { initialTab?: string }) {
  const { role, integrate, notify } = useApp();
  const [prefs, setPrefs] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState<SettingsTab>(
    (SETTINGS_TABS as readonly string[]).includes(initialTab)
      ? (initialTab as SettingsTab)
      : "personal",
  );
  const [blocks, setBlocks] = useState<Record<string, boolean>>({
    "Banking, payments & crypto": true,
    "Government ID & tax": true,
    "Health records": true,
    "Password managers": true,
    "Adult sites": true,
  });
  const update = (key: keyof typeof prefs, value: string | boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };
  const save = () => {
    if (!prefs.name.trim() || Number(prefs.salary) < 0) {
      notify("Add a display name and a non-negative salary expectation.");
      return;
    }
    integrate("settings.save", () => {
      try {
        localStorage.setItem(
          "one-for-all-preview-preferences",
          JSON.stringify(prefs),
        );
        setDirty(false);
        notify(
          "Preferences saved only in this browser. No server profile was updated.",
        );
      } catch {
        notify("Browser storage is unavailable. Your edits remain in memory.");
      }
    });
  };
  return (
    <>
      <PageTitle
        title="Make it feel like your assistant."
        description="The small preferences that help ONE FOR ALL ask less, and understand more."
        action={
          <Button onClick={save} disabled={!dirty}>
            <Save size={16} />
            Save local preferences
          </Button>
        }
      />
      <Tabs
        value={active}
        onValueChange={(value) => setActive(value as SettingsTab)}
      >
        <TabsList>
          <TabsTrigger value="personal">Profile & facts</TabsTrigger>
          <TabsTrigger value="voice">Voice & attention</TabsTrigger>
          <TabsTrigger value="dictation">Dictation</TabsTrigger>
          <TabsTrigger value="safety">Safety & privacy</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        <TabsContent value="dictation">
          <div className="mt-6">
            <DictationWorkspace embedded />
          </div>
        </TabsContent>
        <TabsContent value="personal">
          <section className="panel mt-6">
            <div className="section-heading">
              <h2>A few things I should know</h2>
              <Pill>Fictional profile</Pill>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="display-name">Display name</label>
                <Input
                  id="display-name"
                  value={prefs.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="timezone">Timezone</label>
                <Input id="timezone" value="Asia/Kolkata (IST)" readOnly />
              </div>
              {[
                ["location", "Preferred location"],
                ["salary", "Expected salary (LPA)"],
                ["notice", "Notice period (days)"],
                ["channel", "Saved source channel"],
              ].map(([key, label]) => (
                <div className="field" key={key}>
                  <label htmlFor={`fact-${key}`}>{label}</label>
                  <Input
                    id={`fact-${key}`}
                    type={
                      key === "salary" || key === "notice" ? "number" : "text"
                    }
                    min="0"
                    value={String(prefs[key as keyof typeof prefs])}
                    onChange={(e) =>
                      update(key as keyof typeof prefs, e.target.value)
                    }
                  />
                  <p>Source: user-confirmed sample fact</p>
                </div>
              ))}
            </div>
            <Notice>
              Profile facts are fictional. Local preferences contain no
              credentials, recordings, files or transcripts. A backend must keep
              provenance and ask before changing confirmed facts.
            </Notice>
            <div className="button-row">
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem(
                      "one-for-all-preview-preferences",
                    );
                    if (raw) {
                      setPrefs({ ...initial, ...JSON.parse(raw) });
                      setDirty(false);
                      notify("Loaded preferences from this browser only.");
                    } else notify("No saved local preferences yet.");
                  } catch {
                    notify(
                      "Local preferences could not be read. Current edits were kept.",
                    );
                  }
                }}
              >
                Load saved local preferences
              </Button>
              <IntegrationButton
                id="settings.save"
                label="Profile storage details"
              />
            </div>
          </section>
        </TabsContent>
        <TabsContent value="voice">
          <section className="panel mt-6">
            <h2>Voice, with room for yours.</h2>
            <div className="field">
              <label htmlFor="stock-voice">Stock voice</label>
              <select
                id="stock-voice"
                value={prefs.voice}
                onChange={(e) => update("voice", e.target.value)}
              >
                <option>Calm & clear</option>
                <option>Bright & warm</option>
                <option>Simple & direct</option>
              </select>
              <Button
                className="ml-3"
                variant="ghost"
                onClick={() => integrate("voice.session")}
              >
                <Volume2 size={16} />
                Voice requirements
              </Button>
            </div>
            <div className="field">
              <label htmlFor="language">Transcription profile</label>
              <select
                id="language"
                value={prefs.language}
                onChange={(e) => update("language", e.target.value)}
              >
                <option value="en">English · Gradium</option>
                <option value="hi-en" disabled={role === "visitor"}>
                  Hindi-English · provider chosen after trial
                </option>
              </select>
              <p>
                Selected per person, not per sentence. Speech output remains
                English on Gradium.
              </p>
            </div>
            {[
              [
                "concerns",
                "Important concerns only",
                "Flag contradictions and blockers at your next natural pause; at most once every two minutes.",
              ],
              [
                "pushToTalk",
                "Push to talk",
                "A deliberate alternative for noisy rooms.",
              ],
              [
                "telegram",
                "Telegram notifications",
                "Short results and review links. No sensitive payloads in push text.",
              ],
            ].map(([key, title, desc]) => (
              <div className="setting-row" key={key}>
                <div>
                  <label htmlFor={`toggle-${key}`}>{title}</label>
                  <p>{desc}</p>
                </div>
                <Switch
                  id={`toggle-${key}`}
                  checked={Boolean(prefs[key as keyof typeof prefs])}
                  onCheckedChange={(v) => update(key as keyof typeof prefs, v)}
                />
              </div>
            ))}
            <IntegrationButton
              id="voice.session"
              label="Voice and interruption details"
            />
            {role === "owner" && (
              <div className="button-row">
                <Button variant="outline" asChild>
                  <Link href="/voice-lab">Open owner voice lab</Link>
                </Button>
              </div>
            )}
          </section>
        </TabsContent>
        <TabsContent value="safety">
          <section className="panel mt-6">
            <h2>Some doors should stay closed.</h2>
            <p className="mt-3">
              Sample blocklist presentation. These local switches do not enforce
              a browser policy.
            </p>
            {Object.entries(blocks).map(([name, on]) => (
              <div className="setting-row" key={name}>
                <div>
                  <label htmlFor={`block-${name}`}>{name}</label>
                  <p>
                    {name === "Password managers"
                      ? "Permanently blocked; cannot be changed."
                      : "Blocked by default; owner policy must be enforced by backend and extension."}
                  </p>
                </div>
                <Switch
                  id={`block-${name}`}
                  checked={on}
                  disabled={name === "Password managers" || role !== "owner"}
                  onCheckedChange={(v) =>
                    integrate("browser.permissions", () =>
                      setBlocks((s) => ({ ...s, [name]: v })),
                    )
                  }
                />
              </div>
            ))}
            <Notice>
              Email, cloud storage, and account/security settings ask every time
              and are read-only by default. There is no “always approve” switch.
            </Notice>
            <div className="button-row">
              <Button variant="outline" asChild>
                <Link href="/privacy">Privacy notice & retention</Link>
              </Button>
              <Button
                variant="destructive"
                onClick={() => integrate("privacy.delete")}
              >
                Delete my data
              </Button>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="usage">
          <section className="panel mt-6">
            <div className="section-heading">
              <h2>A budget, not a surprise.</h2>
              <Pill>Sample usage · not measured</Pill>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Limit</th>
                    <th>Visitor</th>
                    <th>Member / owner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Voice</td>
                    <td>10 min/day</td>
                    <td>Configured per user; owner higher caps</td>
                  </tr>
                  <tr>
                    <td>Guest demo tasks</td>
                    <td>3/day</td>
                    <td>Configured by backend budget</td>
                  </tr>
                  <tr>
                    <td>Concurrent browser workers</td>
                    <td>Isolated Playground only</td>
                    <td>Up to 4</td>
                  </tr>
                  <tr>
                    <td>Queue</td>
                    <td>Demo only</td>
                    <td>1 foreground + 3 queued</td>
                  </tr>
                  <tr>
                    <td>Watchers</td>
                    <td>Not available</td>
                    <td>10 active; 7-day expiry</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              A global daily kill switch changes the app to Reader-only. Invite
              codes can be enabled when costs spike. No budget or quota is
              enforced in this local preview.
            </p>
            <IntegrationButton
              id="settings.save"
              label="Budget enforcement handoff"
            />
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
