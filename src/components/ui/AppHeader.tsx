"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { THEME_IDS, THEME_LABELS, type ThemeId } from "@/lib/types/theme";

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  menuItems?: MenuItem[];
}

interface MenuItem {
  label: string;
  onClick: () => void;
}

function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="px-3 py-2 border-b border-border-light">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-1.5">
        Theme
      </span>
      <div className="flex flex-col gap-0.5">
        {THEME_IDS.map((id: ThemeId) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${
              theme === id
                ? "bg-primary/15 text-primary font-medium"
                : "text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {THEME_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AppHeader({ backHref, backLabel, actions, menuItems = [] }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border-light">
      <div className="flex items-center justify-between h-11 px-3 max-w-2xl mx-auto">
        <div className="flex items-center min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="truncate">{backLabel || "Back"}</span>
            </Link>
          ) : (
            <span className="font-bold text-sm text-primary truncate">F&P</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {actions}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                <ThemeSelect />
                {menuItems.length > 0 && (
                  <div className="py-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left text-xs px-3 py-2 text-text-secondary hover:bg-surface-raised transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
