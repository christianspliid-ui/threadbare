/**
 * CMS Content Browser — root layout.
 *
 * Three-panel layout within 100dvh:
 * - Left: category sidebar (w-60)
 * - Center: viewer area (flex-1, scrollable)
 * - Bottom: collapsible detail panel
 */

import { useState, useCallback } from 'react';
import type { CMSSelection } from './types';
import { CMSHeader } from './CMSHeader';
import { CMSSidebar } from './CMSSidebar';
import { CMSMainPanel } from './CMSMainPanel';
import { CMSDetailPanel } from './CMSDetailPanel';
import { getEntryById } from './registry';

export default function ContentBrowser() {
  const [selection, setSelection] = useState<CMSSelection>({ entryId: null, itemKey: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSelectEntry = useCallback((entryId: string) => {
    setSelection({ entryId, itemKey: null });
    setDetailOpen(false);
  }, []);

  const handleSelectItem = useCallback((itemKey: string | number) => {
    setSelection(prev => ({ ...prev, itemKey }));
    setDetailOpen(true);
  }, []);

  const selectedEntry = selection.entryId ? getEntryById(selection.entryId) : null;

  // Resolve selected item data for detail panel
  let selectedItemData: unknown = null;
  if (selectedEntry && selection.itemKey !== null) {
    const d = selectedEntry.data;
    if (Array.isArray(d)) {
      selectedItemData = d[selection.itemKey as number];
    } else if (d && typeof d === 'object') {
      selectedItemData = (d as Record<string, unknown>)[selection.itemKey as string];
    }
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-primary)' }}
    >
      <CMSHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectEntry={handleSelectEntry} />

      <div className="flex-1 flex overflow-hidden">
        <CMSSidebar
          selectedEntryId={selection.entryId}
          onSelectEntry={handleSelectEntry}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <CMSMainPanel
            entry={selectedEntry}
            searchQuery={searchQuery}
            selectedItemKey={selection.itemKey}
            onSelectItem={handleSelectItem}
          />

          {detailOpen && selectedItemData != null && (
            <CMSDetailPanel
              data={selectedItemData}
              itemKey={selection.itemKey}
              entryLabel={selectedEntry?.label}
              onClose={() => setDetailOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
