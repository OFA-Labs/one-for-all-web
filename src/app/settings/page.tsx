import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings";
export const metadata: Metadata = { title: "Settings" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SettingsPage initialTab={tab} />;
}
