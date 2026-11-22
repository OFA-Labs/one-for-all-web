import type { Metadata } from "next";
import { ExtensionPreview } from "@/components/reference-pages";
export const metadata: Metadata = { title: "Browser companion" };
export default function Page() {
  return <ExtensionPreview />;
}
