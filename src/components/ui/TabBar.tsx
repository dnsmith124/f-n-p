"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function TabButtons({
  tabs,
  activeTab,
  onTabChange,
  layout,
}: TabBarProps & { layout: "mobile" | "desktop" }) {
  const isMobile = layout === "mobile";

  return (
    <>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors ${
            isMobile ? "" : "md:flex-row md:gap-2 md:px-4 md:py-3 md:text-xs md:flex-none"
          } ${
            activeTab === tab.id
              ? isMobile
                ? "text-primary bg-surface-raised border-t-2 border-primary"
                : "text-primary bg-surface-raised border-t-2 border-primary md:border-t-0 md:border-l-2"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <span className={isMobile ? "w-5 h-5" : "w-5 h-5 md:w-4 md:h-4"}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </>
  );
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mobileNav = (
    <nav
      aria-label="Character sheet sections"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex w-full max-w-2xl">
        <TabButtons
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          layout="mobile"
        />
      </div>
    </nav>
  );

  return (
    <>
      {mounted && createPortal(mobileNav, document.body)}
      <nav
        aria-label="Character sheet sections"
        className="hidden border-border md:block md:static md:min-h-full md:w-48 md:border-r"
      >
        <div className="flex md:flex-col">
          <TabButtons
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            layout="desktop"
          />
        </div>
      </nav>
    </>
  );
}
