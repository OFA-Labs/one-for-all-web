import type { Metadata } from "next";
import { OfaDesktop } from "@/features/ofa-desktop";

export const metadata: Metadata = { title: "OFA Desktop" };

export default function Page() {
  return <OfaDesktop />;
}
