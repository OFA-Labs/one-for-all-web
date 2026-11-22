"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw Error("Missing theme provider");
  return value;
}

// A tiny external store keeps the theme stable across client navigation and
// avoids a setState-in-effect cascade. The server snapshot is always the
// default so hydration markup matches; the inline bootstrap script has already
// applied the stored theme to <html> before first paint.
let currentTheme: ThemeId = DEFAULT_THEME;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function getSnapshot() {
  return currentTheme;
}
function getServerSnapshot() {
  return DEFAULT_THEME;
}
function updateStore(id: ThemeId) {
  if (currentTheme === id) return;
  currentTheme = id;
  // Colours are pure CSS tokens on <html>; no component is remounted.
  document.documentElement.dataset.theme = id;
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Storage is optional; the default theme still works.
    }
    updateStore(isThemeId(saved) ? saved : DEFAULT_THEME);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    updateStore(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Storage is optional; the in-memory theme still works.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
