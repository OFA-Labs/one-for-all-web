import type { Metadata } from "next";
import { HistoryPage } from "@/components/management";
export const metadata: Metadata = { title: "History" };
export default function Page() {
  return <HistoryPage />;
}
