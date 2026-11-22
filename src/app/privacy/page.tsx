import type { Metadata } from "next";
import { Privacy } from "@/features/reference";
export const metadata: Metadata = { title: "Privacy" };
export default function Page() {
  return <Privacy />;
}
