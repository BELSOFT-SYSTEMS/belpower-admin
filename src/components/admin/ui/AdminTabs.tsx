'use client';

type Tab = {
  id: string;
  label: string;
  badge?: string | number;
};

type AdminTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
};

export function AdminTabs({ tabs, activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="admin_tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`admin_tab ${activeTab === tab.id ? 'admin_tab_active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge !== null && (
            <span className="admin_tab_badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
