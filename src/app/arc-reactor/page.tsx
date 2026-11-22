import type { Metadata } from "next";
import { ArcReactor } from "@/features/arc-reactor";
export const metadata: Metadata = { title: "OFA Engine" };
export default function Page() {
  return <ArcReactor />;
}
