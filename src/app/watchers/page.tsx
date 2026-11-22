import type { Metadata } from "next";
import { Watchers } from "@/features/watcher";
export const metadata: Metadata = { title: "Watchers" };
export default function Page() {
  return <Watchers />;
}
