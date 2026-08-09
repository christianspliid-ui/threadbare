/**
 * CMS Content Browser — root layout.
 *
 * Three-panel layout within 100dvh:
 * - Left: category sidebar (w-60)
 * - Center: viewer area (flex-1, scrollable)
 * - Bottom: collapsible detail panel
 */

import { useState, useCallback } from 'react';
import { CMSHeader } from './CMSHeader';
import { CMSSidebar } from './CMSSidebar';
import { CMSMainPanel } from './CMSMainPanel';
import { CMSDetailPanel } from './CMSDetailPanel';
import { getEntryById } from './registry';
import { useCmsHashRoute } from './useCmsHashRoute';

export default function ContentBrowser() {
  // THR-1046: the hash *is* the selection. The registry has always documented an
  // entry id as the URL fragment and CLAUDE.md has advertised
  // `?view=cms#ia-surfaces` for months, while nothing read it — every such link
  // landed on the empty CMS. Routing through the hash makes those links work and
  // is what gives the Package View one shareable URL per template.
  const { route, setRoute } = useCmsHashRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [itemKey, setItemKey] = useState<string | number | null>(null);

  const selection = { entryId: route.entryId, itemKey };

  const handleSelectEntry = useCallback((entryId: string) => {
    setRoute(entryId);
    setItemKey(null);
    setDetailOpen(false);
  }, [setRoute]);

  const handleSelectItem = useCallback((key: string | number) => {
    setItemKey(key);
    setDetailOpen(true);
  }, []);

  /** Rewrite the current entry's hash parameters, keeping the entry itself. */
  const handleRouteChange = useCallback(
    (params: Readonly<Record<string, string | undefined>>) => {
      if (route.entryId) setRoute(route.entryId, params);
    },
    [route.entryId, setRoute],
  );

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
            routeParams={route.params}
            onRouteChange={handleRouteChange}
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
