import type { Metadata } from "next";
import { SettingsPage } from "@/features/settings";

export const metadata: Metadata = { title: "Connect your computer" };
export default function DesktopPage() {
  return <SettingsPage initialTab="desktop" />;
}
