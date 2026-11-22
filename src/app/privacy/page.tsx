import type { Metadata } from "next";
import { Privacy } from "@/components/reference-pages";
export const metadata: Metadata = { title: "Privacy" };
export default function Page() {
  return <Privacy />;
}
