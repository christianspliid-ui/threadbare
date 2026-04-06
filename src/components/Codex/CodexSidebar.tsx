import { memo } from 'react';
import type { CodexCategory } from './codexRegistry';

interface CodexSidebarProps {
  categories: CodexCategory[];
  selectedCategory: string;
  selectedSubcategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string | null) => void;
}

export const CodexSidebar = memo(function CodexSidebar({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
}: CodexSidebarProps) {
  return (
    <nav
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            color: 'var(--accent-gold)',
            letterSpacing: '0.1em',
          }}
        >
          Codex
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {categories.map(cat => {
          const isActive = cat.id === selectedCategory;
          const totalCount = cat.subcategories.reduce((sum, s) => sum + s.count, 0);

          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                onClick={() => onSelectCategory(cat.id)}
                className="w-full text-left px-4 py-2 transition-colors"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-sm)',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-gold-glow)' : 'transparent',
                  letterSpacing: '0.05em',
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>{cat.glyph}</span>
                {cat.label}
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {totalCount}
                </span>
              </button>

              {/* Subcategories (visible when category is active) */}
              {isActive && cat.subcategories.length > 1 && (
                <div className="pb-1">
                  {/* "All" option */}
                  <button
                    onClick={() => onSelectSubcategory(cat.id, null)}
                    className="w-full text-left px-4 py-1.5 pl-10 transition-colors"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: selectedSubcategory === null ? 'var(--text-primary)' : 'var(--text-muted)',
                      backgroundColor: selectedSubcategory === null ? 'var(--bg-hover)' : 'transparent',
                    }}
                  >
                    All ({totalCount})
                  </button>

                  {cat.subcategories.map(sub => {
                    const isSubActive = selectedSubcategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectSubcategory(cat.id, sub.id)}
                        className="w-full text-left px-4 py-1.5 pl-10 transition-colors"
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: isSubActive ? 'var(--text-primary)' : 'var(--text-muted)',
                          backgroundColor: isSubActive ? 'var(--bg-hover)' : 'transparent',
                        }}
                      >
                        {sub.label}
                        <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
});
