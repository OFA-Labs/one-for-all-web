import type { Metadata } from "next";
import { ArcReactor } from "@/components/arc-reactor";
export const metadata: Metadata = { title: "OFA Engine" };
export default function Page() {
  return <ArcReactor />;
}
