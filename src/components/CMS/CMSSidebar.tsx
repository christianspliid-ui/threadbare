/**
 * CMS Sidebar — category tree navigation derived from registry.
 */

import { useState, useMemo } from 'react';
import { getCategories } from './registry';

interface Props {
  selectedEntryId: string | null;
  onSelectEntry: (id: string) => void;
}

export function CMSSidebar({ selectedEntryId, onSelectEntry }: Props) {
  const categories = useMemo(() => getCategories(), []);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Expand the category containing the selected entry by default
    const set = new Set<string>();
    if (selectedEntryId) {
      const cat = categories.find(c => c.entries.some(e => e.id === selectedEntryId));
      if (cat) set.add(cat.id);
    }
    // Default: expand first category
    if (set.size === 0 && categories.length > 0) set.add(categories[0].id);
    return set;
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  return (
    <div
      className="w-60 flex-none overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      <nav className="py-2">
        {categories.map(cat => {
          const isExpanded = expandedCategories.has(cat.id);
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                <span style={{ fontSize: '0.6rem', transition: 'transform 150ms', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>
                  &#9654;
                </span>
                {cat.label}
                <span className="ml-auto opacity-50">{cat.entries.length}</span>
              </button>

              {isExpanded && (
                <div className="pb-1">
                  {cat.entries.map(entry => {
                    const isSelected = entry.id === selectedEntryId;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => onSelectEntry(entry.id)}
                        className="w-full text-left px-6 py-1 text-sm truncate transition-colors"
                        style={{
                          color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          backgroundColor: isSelected ? 'rgba(212, 160, 64, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '2px solid var(--accent-gold)' : '2px solid transparent',
                        }}
                      >
                        {entry.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
