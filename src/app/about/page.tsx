import type { Metadata } from "next";
import { About } from "@/features/reference";
export const metadata: Metadata = { title: "About" };
export default function Page() {
  return <About />;
}
