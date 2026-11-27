"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDesktop } from "@/components/voice/desktop-provider";
import { OpenDocuments } from "./open-documents";
import { PrivateItems } from "./private-items";

/** What OFA knows about you, stored on this computer by the companion. */
export function InfoCorpus() {
  const { state, run } = useDesktop();
  return (
    <section className="panel mt-6" aria-label="Info corpus">
      <div className="section-heading">
        <h2>Info corpus</h2>
        <span>Stored on this computer</span>
      </div>
      <p className="mt-2">
        What OFA uses to fill forms and answer for you, in two parts.
      </p>
      {!state.connected ? (
        <div className="mt-3">
          <p>Connect this computer to see and edit your information.</p>
          <div className="button-row mt-2">
            <Button
              disabled={state.status === "Connecting"}
              onClick={() => run("connect")}
            >
              Connect computer
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="open" className="mt-4">
          <TabsList>
            <TabsTrigger value="open">Use without consent</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <OpenDocuments />
          </TabsContent>
          <TabsContent value="private">
            <PrivateItems />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}
