import type { Metadata } from "next";
import { OFA } from "@/components/ofa";
export const metadata: Metadata = { title: "O F A · ONE FOR ALL" };
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return <OFA initialMode={mode === "read" ? "read" : "ask"} />;
}
