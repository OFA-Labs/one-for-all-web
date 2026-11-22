import type { Metadata } from "next";
import { VoiceLab } from "@/components/voice-lab";
export const metadata: Metadata = { title: "Owner voice lab" };
export default function Page() {
  return <VoiceLab />;
}
