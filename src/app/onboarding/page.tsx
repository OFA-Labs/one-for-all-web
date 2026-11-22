import type { Metadata } from "next";
import { Onboarding } from "@/features/account";
export const metadata: Metadata = { title: "Get started" };
export default function Page() {
  return <Onboarding />;
}
