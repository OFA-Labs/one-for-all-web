import { redirect } from "next/navigation";

// Caps Lock dictation now lives inside Settings → Dictation. Keep the old URL
// as a redirect so existing links and bookmarks still reach it.
export default function Page() {
  redirect("/settings?tab=dictation");
}
