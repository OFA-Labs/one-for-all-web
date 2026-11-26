"use client";
import { useState } from "react";
import { PageTitle } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DictationWorkspace } from "@/features/settings/components/dictation/dictation-workspace";
import { VoiceStatus } from "@/components/voice/voice-status";

const SETTINGS_TABS = ["desktop", "dictation"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

export function SettingsPage({
  initialTab = "desktop",
}: {
  initialTab?: string;
}) {
  const [active, setActive] = useState<SettingsTab>(
    (SETTINGS_TABS as readonly string[]).includes(initialTab)
      ? (initialTab as SettingsTab)
      : "desktop",
  );
  return (
    <>
      <PageTitle
        title="Manage your computer and voice."
        description="One place for the live desktop pairing, permissions, speech providers and dictation. Controls act on the local companion, not on a preview."
      />
      <Tabs
        value={active}
        onValueChange={(value) => setActive(value as SettingsTab)}
      >
        <TabsList>
          <TabsTrigger value="desktop">Computer &amp; voice</TabsTrigger>
          <TabsTrigger value="dictation">Dictation</TabsTrigger>
        </TabsList>
        <TabsContent value="desktop">
          <VoiceStatus />
        </TabsContent>
        <TabsContent value="dictation">
          <div className="mt-6">
            <DictationWorkspace embedded />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
