export type TabId = 'overview' | 'prowess' | 'bonds' | 'journey' | 'chronicle';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'prowess', label: 'Prowess' },
  { id: 'bonds', label: 'Bonds' },
  { id: 'journey', label: 'Journey' },
  { id: 'chronicle', label: 'Chronicle' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex gap-1 border-b border-stone-700 mb-3">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={[
            'px-3 py-2 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-b-2 border-amber-500 text-amber-200'
              : 'text-stone-400 hover:text-stone-200',
          ].join(' ')}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
