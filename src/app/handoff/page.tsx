import type { Metadata } from "next";
import { Handoff } from "@/components/reference-pages";
export const metadata: Metadata = { title: "Developer handoff" };
export default function Page() {
  return <Handoff />;
}
