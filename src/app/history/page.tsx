import type { Metadata } from "next";
import { HistoryCalendar } from "@/features/history";
export const metadata: Metadata = { title: "History" };
export default function Page() {
  return <HistoryCalendar />;
}
