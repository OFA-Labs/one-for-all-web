import type { Metadata } from "next";
import { Handoff } from "@/features/reference";
export const metadata: Metadata = { title: "Developer handoff" };
export default function Page() {
  return <Handoff />;
}
