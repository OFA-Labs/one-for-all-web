"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { THEMES, type ThemeId } from "@/config/themes";
import { useTheme } from "@/app/providers/theme-provider";

/** A three-band swatch. The `data-theme` attribute scopes the shared theme
 * tokens to the swatch itself, so its preview always shows that theme's
 * canvas / outer card / inner card colours without duplicating any hex. */
function ThemeSwatch({ id }: { id: ThemeId }) {
  return (
    <span className="theme-swatch" data-theme={id} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-selector" ref={root}>
      <button
        type="button"
        className="theme-trigger"
        aria-label={`Theme: ${active.name}. Choose a theme`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Premium themes"
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeSwatch id={active.id} />
        <span className="theme-trigger-name">{active.name}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="theme-menu" role="menu" aria-label="Premium themes">
          <p className="theme-menu-label">Premium themes</p>
          {THEMES.map((option) => {
            const selected = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`theme-option${selected ? " is-active" : ""}`}
                onClick={() => {
                  setTheme(option.id);
                  setOpen(false);
                }}
              >
                <ThemeSwatch id={option.id} />
                <span className="theme-option-text">
                  <strong>{option.name}</strong>
                  <small>{option.caption}</small>
                </span>
                {selected && <Check size={15} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
