import type { Metadata } from "next";
import { VoiceStatus } from "@/components/voice/voice-status";

export const metadata: Metadata = { title: "Connect your computer" };
export default function DesktopPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Connect your computer</h1>
      <p className="mt-2">
        Local development setup. Account sign-in is not connected yet.
      </p>
      <VoiceStatus />
    </div>
  );
}
