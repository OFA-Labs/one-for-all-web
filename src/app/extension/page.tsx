import type { Metadata } from "next";
import { ExtensionPreview } from "@/features/reference";
export const metadata: Metadata = { title: "Browser companion" };
export default function Page() {
  return <ExtensionPreview />;
}
