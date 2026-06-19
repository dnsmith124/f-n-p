"use client";

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

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 md:static md:border-t-0 md:border-r md:border-border md:w-48 md:min-h-full">
      <div className="flex md:flex-col">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors md:flex-row md:gap-2 md:px-4 md:py-3 md:text-xs md:flex-none ${
              activeTab === tab.id
                ? "text-primary bg-surface-raised border-t-2 border-primary md:border-t-0 md:border-l-2"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <span className="w-5 h-5 md:w-4 md:h-4">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
