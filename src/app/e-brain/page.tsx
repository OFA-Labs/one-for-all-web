import type { Metadata } from "next";
import { EBrain } from "@/features/e-brain";

export const metadata: Metadata = { title: "e-brain" };

export default function Page() {
  return <EBrain />;
}
