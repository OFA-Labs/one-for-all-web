import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Keep punctuation inside email addresses, versions and amounts intact.
// A punctuation regex can silently discard the beginning of these sentences.
export function segmentText(text: string): string[] {
  return Array.from(
    new Intl.Segmenter("en", { granularity: "sentence" }).segment(text),
    ({ segment }) => segment.trim(),
  ).filter(Boolean);
}
export function downloadFile(
  name: string,
  content: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
