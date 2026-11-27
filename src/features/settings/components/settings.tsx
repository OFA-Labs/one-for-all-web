"use client";
import { useState } from "react";
import { PageTitle } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DictationWorkspace } from "@/features/settings/components/dictation/dictation-workspace";
import { ConnectionSection } from "@/components/voice/sections/connection-section";
import { EyesSection } from "@/components/voice/sections/eyes-section";
import { HandsSection } from "@/components/voice/sections/hands-section";
import { PendingCards } from "@/components/voice/sections/pending-cards";
import { VoiceSection } from "@/components/voice/sections/voice-section";

const SETTINGS_TABS = [
  "connection",
  "voice",
  "eyes",
  "hands",
  "dictation",
] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];
/** Older links (/desktop, ?tab=desktop) open the connection tab. */
const ALIASES: Record<string, SettingsTab> = { desktop: "connection" };

function tabOf(value: string): SettingsTab {
  if ((SETTINGS_TABS as readonly string[]).includes(value))
    return value as SettingsTab;
  return ALIASES[value] ?? "connection";
}

export function SettingsPage({
  initialTab = "connection",
}: {
  initialTab?: string;
}) {
  const [active, setActive] = useState<SettingsTab>(tabOf(initialTab));
  return (
    <>
      <PageTitle
        title="Manage your computer and voice."
        description="How OFA connects, listens and speaks, sees your screen, and what its hands may do. Controls act on the local companion, not on a preview."
      />
      <PendingCards />
      <Tabs
        value={active}
        onValueChange={(value) => setActive(value as SettingsTab)}
      >
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="eyes">Eyes</TabsTrigger>
          <TabsTrigger value="hands">Hands</TabsTrigger>
          <TabsTrigger value="dictation">Dictation</TabsTrigger>
        </TabsList>
        <TabsContent value="connection">
          <ConnectionSection />
        </TabsContent>
        <TabsContent value="voice">
          <VoiceSection />
        </TabsContent>
        <TabsContent value="eyes">
          <EyesSection />
        </TabsContent>
        <TabsContent value="hands">
          <HandsSection />
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
