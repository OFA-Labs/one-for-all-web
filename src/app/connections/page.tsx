import type { Metadata } from "next";
import { Connections } from "@/features/connections";
export const metadata: Metadata = { title: "Connections" };
export default function Page() {
  return <Connections />;
}
