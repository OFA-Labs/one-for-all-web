import type { Metadata } from "next";
import { Watchers } from "@/components/management";
export const metadata: Metadata = { title: "Watchers" };
export default function Page() {
  return <Watchers />;
}
