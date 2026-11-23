/**
 * The single source of truth for ONE FOR ALL's two premium themes.
 *
 * Theme *colours* live in `globals.css` as the `--t-*` design tokens; this file
 * only holds the identifiers and labels shared by the selector, the provider
 * and storage. Keeping it here means no component hardcodes a theme id.
 */
export const THEME_IDS = ["obsidian", "aurora"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "obsidian";

export const THEME_STORAGE_KEY = "one-for-all-theme";

export const THEMES: ReadonlyArray<{
  id: ThemeId;
  name: string;
  caption: string;
}> = [
  { id: "obsidian", name: "Obsidian", caption: "Pure Black" },
  { id: "aurora", name: "Aurora", caption: "White + Grey + Black" },
];

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as readonly string[]).includes(value as string)
  );
}
